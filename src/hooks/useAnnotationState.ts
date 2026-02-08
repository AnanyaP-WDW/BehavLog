import { useState, useCallback, useEffect, type RefObject } from 'react';
import type { Keypoint, KeypointDefinition } from '../types';
import { FPS } from '../constants/keypoints';
import { useVideoStorage } from './useVideoStorage';

export function useAnnotationState(
  videoRef: RefObject<HTMLVideoElement | null>,
  keypointDefinitions: KeypointDefinition[]
) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [keypoints, setKeypoints] = useState<Record<string, Keypoint>>({});
  const [activeKeypoint, setActiveKeypoint] = useState(0);
  const [annotations, setAnnotations] = useState<Record<number, Record<string, Keypoint>>>({});
  const [zoom, setZoom] = useState(1);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [keypointSize, setKeypointSize] = useState(7);
  const [showKeypointText, setShowKeypointText] = useState(true);
  
  const { storeVideo, loadAnnotations, saveAnnotations } = useVideoStorage();

  const handleVideoUpload = useCallback(async (file: File) => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoName(file.name);
    setVideoId(null);
    setCurrentFrame(0);
    setKeypoints({});
    setAnnotations({});
    setTotalFrames(0);
  }, [videoUrl]);

  const handleVideoLoaded = useCallback(async () => {
    if (videoRef.current) {
      const frames = Math.floor(videoRef.current.duration * FPS);
      setTotalFrames(frames);
      
      // Store video in database if it's a new upload
      if (!videoId && videoName) {
        try {
          const storedVideoId = await storeVideo(
            new File([await fetch(videoUrl!).then(r => r.blob())], videoName),
            videoRef.current
          );
          if (storedVideoId) {
            setVideoId(storedVideoId);
            setSaveStatus('Video saved to library');
            setTimeout(() => setSaveStatus(''), 2000);
          }
        } catch (error) {
          console.error('Failed to store video:', error);
        }
      }
    }
  }, [videoRef, videoId, videoName, videoUrl, storeVideo]);

  const saveCurrentFrame = useCallback(() => {
    if (Object.keys(keypoints).length > 0) {
      setAnnotations((prev) => ({
        ...prev,
        [currentFrame]: { ...keypoints },
      }));
    }
  }, [currentFrame, keypoints]);

  const getResolution = useCallback((): [number, number] => {
    if (videoRef.current) {
      return [videoRef.current.videoWidth, videoRef.current.videoHeight];
    }
    return [0, 0];
  }, [videoRef]);

  const autoSaveAnnotations = useCallback(async () => {
    if (!videoId || !videoName) return;
    
    try {
      const allAnnotations = { ...annotations };
      if (Object.keys(keypoints).length > 0) {
        allAnnotations[currentFrame] = keypoints;
      }
      
      const annotationData = {
        video_name: videoName,
        fps: FPS,
        resolution: getResolution(),
        annotations: Object.entries(allAnnotations).map(([frameIdx, kps]) => ({
          frame_idx: parseInt(frameIdx),
          timestamp: parseInt(frameIdx) / FPS,
          keypoints: kps,
        })),
      };
      
      await saveAnnotations(videoId, annotationData);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [videoId, videoName, annotations, keypoints, currentFrame, getResolution, saveAnnotations]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!videoId) return;
    
    const interval = setInterval(() => {
      autoSaveAnnotations();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [videoId, autoSaveAnnotations]);

  const navigateFrame = useCallback(
    (delta: number) => {
      if (!videoRef.current) return;

      saveCurrentFrame();

      const newFrame = Math.max(0, Math.min(currentFrame + delta, totalFrames - 1));
      setCurrentFrame(newFrame);
      videoRef.current.currentTime = newFrame / FPS;

      // Load annotations for new frame if they exist
      setAnnotations((prev) => {
        if (prev[newFrame]) {
          setKeypoints(prev[newFrame]);
        } else {
          setKeypoints({});
        }
        return prev;
      });
    },
    [currentFrame, totalFrames, saveCurrentFrame, videoRef]
  );

  const seekFrame = useCallback(
    (frame: number) => {
      if (!videoRef.current || totalFrames === 0) return;

      saveCurrentFrame();

      const newFrame = Math.max(0, Math.min(frame, totalFrames - 1));
      setCurrentFrame(newFrame);
      videoRef.current.currentTime = newFrame / FPS;

      setAnnotations((prev) => {
        if (prev[newFrame]) {
          setKeypoints(prev[newFrame]);
        } else {
          setKeypoints({});
        }
        return prev;
      });
    },
    [saveCurrentFrame, totalFrames, videoRef]
  );

  const placeKeypoint = useCallback(
    (x: number, y: number) => {
      const kpName = keypointDefinitions[activeKeypoint]?.name;
      if (!kpName) return;
      
      setKeypoints((prev) => ({
        ...prev,
        [kpName]: { x, y, visible: true, confidence: 1.0 },
      }));
      // Auto-advance to next keypoint
      setActiveKeypoint((prev) => (prev + 1) % keypointDefinitions.length);
    },
    [activeKeypoint, keypointDefinitions]
  );

  const toggleVisibility = useCallback(() => {
    const kpName = keypointDefinitions[activeKeypoint]?.name;
    if (kpName && keypoints[kpName]) {
      setKeypoints((prev) => ({
        ...prev,
        [kpName]: { ...prev[kpName], visible: !prev[kpName].visible },
      }));
    }
  }, [activeKeypoint, keypoints, keypointDefinitions]);

  const copyFromPrevious = useCallback(() => {
    const prevFrame = currentFrame - 1;
    setAnnotations((prev) => {
      if (prev[prevFrame]) {
        setKeypoints({ ...prev[prevFrame] });
        setSaveStatus('Copied from previous frame');
        setTimeout(() => setSaveStatus(''), 2000);
      }
      return prev;
    });
  }, [currentFrame]);

  const removeKeypoint = useCallback((keypointName?: string) => {
    const kpName = keypointName || keypointDefinitions[activeKeypoint]?.name;
    if (!kpName) return;
    
    setKeypoints((prev) => {
      const newKeypoints = { ...prev };
      delete newKeypoints[kpName];
      return newKeypoints;
    });
    setSaveStatus(`Removed ${kpName.replace(/_/g, ' ')}`);
    setTimeout(() => setSaveStatus(''), 2000);
  }, [activeKeypoint, keypointDefinitions]);

  const loadStoredVideo = useCallback(async (video: any, videoUrl: string) => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    
    setVideoUrl(videoUrl);
    setVideoName(video.name);
    setVideoId(video.id);
    setCurrentFrame(0);
    setKeypoints({});
    setAnnotations({});
    setTotalFrames(0);
    
    // Load existing annotations if they exist
    try {
      const existingAnnotations = await loadAnnotations(video.id);
      if (existingAnnotations) {
        setAnnotations(existingAnnotations.annotations.reduce((acc, frame) => {
          acc[frame.frame_idx] = frame.keypoints;
          return acc;
        }, {} as Record<number, Record<string, Keypoint>>));
        setSaveStatus('Loaded existing annotations');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (error) {
      console.error('Failed to load annotations:', error);
    }
  }, [loadAnnotations]);

  const getAnnotationCount = useCallback(() => {
    return Object.keys(annotations).length;
  }, [annotations]);

  const getProgress = useCallback(() => {
    if (totalFrames === 0) return 0;
    return Math.round((Object.keys(annotations).length / totalFrames) * 100);
  }, [annotations, totalFrames]);

  const getAllAnnotations = useCallback(() => {
    // Include current frame keypoints
    const allAnnotations = { ...annotations };
    if (Object.keys(keypoints).length > 0) {
      allAnnotations[currentFrame] = keypoints;
    }
    return allAnnotations;
  }, [annotations, currentFrame, keypoints]);

  return {
    videoUrl,
    videoName,
    videoId,
    currentFrame,
    totalFrames,
    keypoints,
    activeKeypoint,
    annotations,
    zoom,
    showSkeleton,
    saveStatus,
    keypointSize,
    showKeypointText,
    setActiveKeypoint,
    setZoom,
    setShowSkeleton,
    setSaveStatus,
    setKeypointSize,
    setShowKeypointText,
    handleVideoUpload,
    handleVideoLoaded,
    navigateFrame,
    seekFrame,
    placeKeypoint,
    toggleVisibility,
    copyFromPrevious,
    removeKeypoint,
    loadStoredVideo,
    getResolution,
    getAnnotationCount,
    getProgress,
    getAllAnnotations,
    saveCurrentFrame,
    autoSaveAnnotations,
  };
}
