import { useState, useEffect, useCallback } from 'react';
import { db, type StoredVideo, type StoredAnnotation, type StoredBehaviors } from '../utils/database';
import type { AnnotationData, BehaviorDefinition, BehaviorInstance } from '../types';

export function useVideoStorage() {
  const [videos, setVideos] = useState<StoredVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize database and load videos
  useEffect(() => {
    const initDB = async () => {
      try {
        await db.init();
        await loadVideos();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
      } finally {
        setIsLoading(false);
      }
    };

    initDB();
  }, []);

  const loadVideos = useCallback(async () => {
    try {
      const allVideos = await db.getAllVideos();
      // Sort by upload date, newest first
      allVideos.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      setVideos(allVideos);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    }
  }, []);

  const storeVideo = useCallback(async (
    file: File,
    videoElement: HTMLVideoElement
  ): Promise<string | null> => {
    try {
      setError(null);
      
      // Generate thumbnail
      const thumbnail = await db.generateThumbnail(videoElement);
      
      const videoData: Omit<StoredVideo, 'id'> = {
        name: file.name,
        blob: file,
        uploadDate: new Date(),
        duration: videoElement.duration,
        resolution: [videoElement.videoWidth, videoElement.videoHeight],
        thumbnail,
      };

      const videoId = await db.storeVideo(videoData);
      await loadVideos(); // Refresh the list
      return videoId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to store video');
      return null;
    }
  }, [loadVideos]);

  const deleteVideo = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await db.deleteVideo(id);
      await loadVideos(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete video');
      return false;
    }
  }, [loadVideos]);

  const getVideoUrl = useCallback((video: StoredVideo): string => {
    return URL.createObjectURL(video.blob);
  }, []);

  const saveAnnotations = useCallback(async (
    videoId: string,
    annotationData: AnnotationData
  ): Promise<boolean> => {
    try {
      setError(null);
      
      const annotation: Omit<StoredAnnotation, 'id'> = {
        videoId,
        data: annotationData,
        lastModified: new Date(),
      };

      await db.storeAnnotation(annotation);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save annotations');
      return false;
    }
  }, []);

  const loadAnnotations = useCallback(async (videoId: string): Promise<AnnotationData | null> => {
    try {
      setError(null);
      const annotation = await db.getAnnotation(videoId);
      return annotation?.data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load annotations');
      return null;
    }
  }, []);

  const saveBehaviors = useCallback(
    async (
      videoId: string,
      behaviors: BehaviorInstance[],
      behaviorDefinitions: BehaviorDefinition[]
    ): Promise<boolean> => {
      try {
        setError(null);
        const behaviorData: Omit<StoredBehaviors, 'id'> = {
          videoId,
          behaviors,
          behaviorDefinitions,
          lastModified: new Date(),
        };
        await db.storeBehaviors(behaviorData);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save behaviors');
        return false;
      }
    },
    []
  );

  const loadBehaviors = useCallback(async (videoId: string): Promise<StoredBehaviors | null> => {
    try {
      setError(null);
      return await db.getBehaviors(videoId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load behaviors');
      return null;
    }
  }, []);

  return {
    videos,
    isLoading,
    error,
    storeVideo,
    deleteVideo,
    getVideoUrl,
    saveAnnotations,
    loadAnnotations,
    saveBehaviors,
    loadBehaviors,
    refreshVideos: loadVideos,
  };
}