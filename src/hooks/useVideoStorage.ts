import { useState, useEffect, useCallback } from 'react';
import { db, type StoredAnnotation, type StoredBehaviors } from '../utils/database';
import type {
  AnnotationData,
  BehaviorDefinition,
  BehaviorInstance,
  ProjectSummary,
  StoredVideoRecord,
} from '../types';

export function useVideoStorage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [videos, setVideos] = useState<StoredVideoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const allProjects = await db.getProjects();
      allProjects.sort(
        (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );
      setProjects(allProjects);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    }
  }, []);

  useEffect(() => {
    const initDB = async () => {
      try {
        await db.init();
        await loadProjects();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
      } finally {
        setIsLoading(false);
      }
    };

    initDB();
  }, [loadProjects]);

  const loadVideos = useCallback(async (projectId?: string) => {
    if (!projectId) {
      setVideos([]);
      return;
    }

    try {
      setIsLoading(true);
      const projectVideos = await db.getVideosByProject(projectId);
      projectVideos.sort(
        (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );
      setVideos(projectVideos);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(async (name: string): Promise<string | null> => {
    const projectName = name.trim();
    if (!projectName) {
      setError('Project name is required');
      return null;
    }

    try {
      setError(null);
      const projectId = await db.createProject(projectName);
      await loadProjects();
      return projectId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      return null;
    }
  }, [loadProjects]);

  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    try {
      setError(null);
      await db.deleteProject(projectId);
      await loadProjects();
      setVideos((currentVideos) =>
        currentVideos.filter((video) => video.projectId !== projectId)
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      return false;
    }
  }, [loadProjects]);

  const storeVideo = useCallback(async (
    projectId: string,
    file: File,
    videoElement: HTMLVideoElement
  ): Promise<string | null> => {
    try {
      setError(null);

      const videoData = {
        name: file.name,
        blob: file,
        duration: videoElement.duration,
        resolution: [videoElement.videoWidth, videoElement.videoHeight] as [number, number],
      };

      const videoId = await db.storeVideo(projectId, videoData);
      await Promise.all([loadProjects(), loadVideos(projectId)]);
      return videoId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to store video');
      return null;
    }
  }, [loadVideos]);

  const deleteVideo = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const video = await db.getVideo(id);
      await db.deleteVideo(id);
      await loadProjects();
      if (video) {
        await loadVideos(video.projectId);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete video');
      return false;
    }
  }, [loadVideos]);

  const getVideoUrl = useCallback((video: StoredVideoRecord): string => {
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

  const loadVideoExportData = useCallback(async (videoId: string) => {
    const [annotationData, storedBehaviors] = await Promise.all([
      loadAnnotations(videoId),
      loadBehaviors(videoId),
    ]);

    return {
      annotationData,
      storedBehaviors,
    };
  }, [loadAnnotations, loadBehaviors]);

  return {
    projects,
    videos,
    isLoading,
    error,
    createProject,
    deleteProject,
    storeVideo,
    deleteVideo,
    getVideoUrl,
    saveAnnotations,
    loadAnnotations,
    saveBehaviors,
    loadBehaviors,
    loadVideoExportData,
    refreshProjects: loadProjects,
    refreshVideos: loadVideos,
  };
}