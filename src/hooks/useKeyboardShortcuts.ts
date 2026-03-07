import { useEffect } from 'react';
import type { BehaviorDefinition, KeypointDefinition } from '../types';

interface UseKeyboardShortcutsProps {
  setActiveKeypoint: (index: number) => void;
  navigateFrame: (delta: number) => void;
  toggleVisibility: () => void;
  copyFromPrevious: () => void;
  removeKeypoint: () => void;
  keypointDefinitions: KeypointDefinition[];
  behaviorDefinitions: BehaviorDefinition[];
  toggleBehaviorRecording: (behaviorId: string) => void;
  stopBehaviorRecording: () => void;
  undoBehaviors: () => void;
  redoBehaviors: () => void;
}

export function useKeyboardShortcuts({
  setActiveKeypoint,
  navigateFrame,
  toggleVisibility,
  copyFromPrevious,
  removeKeypoint,
  keypointDefinitions,
  behaviorDefinitions,
  toggleBehaviorRecording,
  stopBehaviorRecording,
  undoBehaviors,
  redoBehaviors,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Number keys to select keypoint
      const kpIndex = keypointDefinitions.findIndex((kp) => kp.key === key);
      if (kpIndex !== -1) {
        setActiveKeypoint(kpIndex);
        return;
      }

      if (key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          redoBehaviors();
        } else {
          undoBehaviors();
        }
        return;
      }

      if (key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        redoBehaviors();
        return;
      }

      const behavior = behaviorDefinitions.find((item) => item.key === key);
      if (behavior) {
        toggleBehaviorRecording(behavior.id);
        return;
      }

      // Navigation and actions
      switch (key) {
        case ' ':
          e.preventDefault();
          if (e.shiftKey) {
            navigateFrame(-1);
          } else {
            navigateFrame(1);
          }
          break;
        case 'arrowright':
          e.preventDefault();
          navigateFrame(1);
          break;
        case 'arrowleft':
          e.preventDefault();
          navigateFrame(-1);
          break;
        case 'v':
          toggleVisibility();
          break;
        case 'c':
          copyFromPrevious();
          break;
        case 'delete':
        case 'backspace':
          e.preventDefault();
          removeKeypoint();
          break;
        case 'escape':
          stopBehaviorRecording();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setActiveKeypoint,
    navigateFrame,
    toggleVisibility,
    copyFromPrevious,
    removeKeypoint,
    keypointDefinitions,
    behaviorDefinitions,
    toggleBehaviorRecording,
    stopBehaviorRecording,
    undoBehaviors,
    redoBehaviors,
  ]);
}
