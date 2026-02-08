import { useCallback, useEffect, useMemo, useState } from 'react';
import { FPS } from '../constants/keypoints';
import type { BehaviorDefinition, BehaviorInstance } from '../types';
import { useVideoStorage } from './useVideoStorage';

interface UseBehaviorStateProps {
  videoId: string | null;
  behaviorDefinitions: BehaviorDefinition[];
  allowBehaviorOverlap: boolean;
}

export function useBehaviorState({
  videoId,
  behaviorDefinitions,
  allowBehaviorOverlap,
}: UseBehaviorStateProps) {
  const [behaviors, setBehaviors] = useState<BehaviorInstance[]>([]);
  const [activeBehavior, setActiveBehavior] = useState<string | null>(null);
  const [recordingStartFrame, setRecordingStartFrame] = useState<number | null>(null);
  const [undoStack, setUndoStack] = useState<BehaviorInstance[][]>([]);
  const [redoStack, setRedoStack] = useState<BehaviorInstance[][]>([]);

  const { saveBehaviors, loadBehaviors } = useVideoStorage();

  const pushHistory = useCallback((snapshot: BehaviorInstance[]) => {
    setUndoStack((prev) => {
      const next = [...prev, snapshot];
      if (next.length > 50) {
        next.shift();
      }
      return next;
    });
    setRedoStack([]);
  }, []);

  const resetBehaviors = useCallback(() => {
    pushHistory(behaviors);
    setBehaviors([]);
    setActiveBehavior(null);
    setRecordingStartFrame(null);
  }, [behaviors, pushHistory]);

  const startRecording = useCallback((behaviorId: string, frame: number) => {
    setActiveBehavior(behaviorId);
    setRecordingStartFrame(frame);
  }, []);

  const stopRecording = useCallback(
    (frame: number) => {
      if (!activeBehavior || recordingStartFrame === null) {
        return null;
      }

      const startFrame = Math.min(recordingStartFrame, frame);
      const endFrame = Math.max(recordingStartFrame, frame);
      if (!allowBehaviorOverlap) {
        const overlaps = behaviors.some(
          (behavior) =>
            !(endFrame < behavior.startFrame || startFrame > behavior.endFrame)
        );
        if (overlaps) {
          setActiveBehavior(null);
          setRecordingStartFrame(null);
          return null;
        }
      }
      const newBehavior: BehaviorInstance = {
        id: `behavior_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        behaviorId: activeBehavior,
        startFrame,
        endFrame,
        startTimestamp: startFrame / FPS,
        endTimestamp: endFrame / FPS,
      };

      pushHistory(behaviors);
      setBehaviors((prev) => [...prev, newBehavior]);
      setActiveBehavior(null);
      setRecordingStartFrame(null);
      return newBehavior;
    },
    [activeBehavior, recordingStartFrame, allowBehaviorOverlap, behaviors, pushHistory]
  );

  const toggleRecording = useCallback(
    (behaviorId: string, frame: number) => {
      if (activeBehavior === behaviorId) {
        stopRecording(frame);
        return;
      }
      if (activeBehavior) {
        stopRecording(frame);
      }
      startRecording(behaviorId, frame);
    },
    [activeBehavior, startRecording, stopRecording]
  );

  const updateBehavior = useCallback((id: string, updates: Partial<BehaviorInstance>) => {
    setBehaviors((prev) => {
      const next = prev.map((behavior) =>
        behavior.id === id
          ? {
              ...behavior,
              ...updates,
              startFrame: Math.max(0, updates.startFrame ?? behavior.startFrame),
              endFrame: Math.max(0, updates.endFrame ?? behavior.endFrame),
            }
          : behavior
      );
      const updated = next.find((behavior) => behavior.id === id);
      if (updated) {
        if (updated.startFrame > updated.endFrame) {
          const temp = updated.startFrame;
          updated.startFrame = updated.endFrame;
          updated.endFrame = temp;
        }
        updated.startTimestamp = updated.startFrame / FPS;
        updated.endTimestamp = updated.endFrame / FPS;
      }
      if (!allowBehaviorOverlap) {
        if (updated) {
          const overlaps = next.some(
            (behavior) =>
              behavior.id !== id &&
              !(updated.endFrame < behavior.startFrame || updated.startFrame > behavior.endFrame)
          );
          if (overlaps) {
            return prev;
          }
        }
      }
      pushHistory(prev);
      return next;
    });
  }, [allowBehaviorOverlap, pushHistory]);

  const deleteBehavior = useCallback((id: string) => {
    setBehaviors((prev) => {
      pushHistory(prev);
      return prev.filter((behavior) => behavior.id !== id);
    });
  }, [pushHistory]);

  const undoBehaviors = useCallback(() => {
    setUndoStack((prevUndo) => {
      if (prevUndo.length === 0) return prevUndo;
      const previous = prevUndo[prevUndo.length - 1];
      setRedoStack((prevRedo) => [...prevRedo, behaviors]);
      setBehaviors(previous);
      return prevUndo.slice(0, -1);
    });
  }, [behaviors]);

  const redoBehaviors = useCallback(() => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      const next = prevRedo[prevRedo.length - 1];
      setUndoStack((prevUndo) => [...prevUndo, behaviors]);
      setBehaviors(next);
      return prevRedo.slice(0, -1);
    });
  }, [behaviors]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const getBehaviorsAtFrame = useCallback(
    (frame: number) => behaviors.filter((behavior) => frame >= behavior.startFrame && frame <= behavior.endFrame),
    [behaviors]
  );

  const behaviorDefinitionsMap = useMemo(() => {
    return new Map(behaviorDefinitions.map((behavior) => [behavior.id, behavior]));
  }, [behaviorDefinitions]);

  const autoSaveBehaviors = useCallback(async () => {
    if (!videoId) return;
    await saveBehaviors(videoId, behaviors, behaviorDefinitions);
  }, [videoId, behaviors, behaviorDefinitions, saveBehaviors]);

  const loadStoredBehaviors = useCallback(
    async (videoIdToLoad: string) => {
      const stored = await loadBehaviors(videoIdToLoad);
      if (stored) {
        setBehaviors(stored.behaviors);
      } else {
        setBehaviors([]);
      }
    },
    [loadBehaviors]
  );

  useEffect(() => {
    if (!videoId) return;
    const interval = setInterval(() => {
      autoSaveBehaviors();
    }, 30000);
    return () => clearInterval(interval);
  }, [videoId, autoSaveBehaviors]);

  useEffect(() => {
    if (!videoId) return;
    autoSaveBehaviors();
  }, [behaviors, behaviorDefinitions, videoId, autoSaveBehaviors]);

  return {
    behaviors,
    activeBehavior,
    recordingStartFrame,
    behaviorDefinitionsMap,
    startRecording,
    stopRecording,
    toggleRecording,
    updateBehavior,
    deleteBehavior,
    getBehaviorsAtFrame,
    resetBehaviors,
    loadStoredBehaviors,
    undoBehaviors,
    redoBehaviors,
    canUndo,
    canRedo,
  };
}
