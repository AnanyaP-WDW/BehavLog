import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { BehaviorDefinition, KeypointDefinition } from '../types';
import { KEYPOINT_DEFINITIONS } from '../constants/keypoints';
import { DEFAULT_BEHAVIOR_DEFINITIONS } from '../constants/behaviors';

interface SettingsContextType {
  keypointDefinitions: KeypointDefinition[];
  updateKeypointDefinitions: (definitions: KeypointDefinition[]) => void;
  addKeypointDefinition: (definition: Omit<KeypointDefinition, 'key'>) => void;
  removeKeypointDefinition: (index: number) => void;
  updateKeypointDefinition: (index: number, definition: Partial<KeypointDefinition>) => void;
  resetToDefault: () => void;
  behaviorDefinitions: BehaviorDefinition[];
  updateBehaviorDefinitions: (definitions: BehaviorDefinition[]) => void;
  addBehaviorDefinition: (definition: Omit<BehaviorDefinition, 'id'>) => void;
  removeBehaviorDefinition: (id: string) => void;
  updateBehaviorDefinition: (id: string, definition: Partial<BehaviorDefinition>) => void;
  resetBehaviorsToDefault: () => void;
  allowBehaviorOverlap: boolean;
  setAllowBehaviorOverlap: (allow: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [keypointDefinitions, setKeypointDefinitions] = useState<KeypointDefinition[]>(
    () => {
      // Try to load from localStorage
      const saved = localStorage.getItem('keypointDefinitions');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return KEYPOINT_DEFINITIONS;
        }
      }
      return KEYPOINT_DEFINITIONS;
    }
  );
  const [behaviorDefinitions, setBehaviorDefinitions] = useState<BehaviorDefinition[]>(
    () => {
      const saved = localStorage.getItem('behaviorDefinitions');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return DEFAULT_BEHAVIOR_DEFINITIONS;
        }
      }
      return DEFAULT_BEHAVIOR_DEFINITIONS;
    }
  );
  const [allowBehaviorOverlap, setAllowBehaviorOverlapState] = useState<boolean>(() => {
    const saved = localStorage.getItem('allowBehaviorOverlap');
    if (saved) {
      return saved === 'true';
    }
    return true;
  });

  const updateKeypointDefinitions = useCallback((definitions: KeypointDefinition[]) => {
    setKeypointDefinitions(definitions);
    localStorage.setItem('keypointDefinitions', JSON.stringify(definitions));
  }, []);

  const addKeypointDefinition = useCallback((definition: Omit<KeypointDefinition, 'key'>) => {
    const newDefinitions = [...keypointDefinitions];
    // Generate a unique key
    let key = '1';
    const usedKeys = new Set(newDefinitions.map(kp => kp.key));
    for (let i = 1; i <= 10; i++) {
      if (!usedKeys.has(i.toString())) {
        key = i.toString();
        break;
      }
    }
    // If all 1-9 are used, use letters
    if (usedKeys.has(key)) {
      for (let i = 0; i < 26; i++) {
        const letterKey = String.fromCharCode(97 + i); // a-z
        if (!usedKeys.has(letterKey)) {
          key = letterKey;
          break;
        }
      }
    }
    
    newDefinitions.push({ ...definition, key });
    updateKeypointDefinitions(newDefinitions);
  }, [keypointDefinitions, updateKeypointDefinitions]);

  const removeKeypointDefinition = useCallback((index: number) => {
    const newDefinitions = keypointDefinitions.filter((_, i) => i !== index);
    updateKeypointDefinitions(newDefinitions);
  }, [keypointDefinitions, updateKeypointDefinitions]);

  const updateKeypointDefinition = useCallback((index: number, definition: Partial<KeypointDefinition>) => {
    const newDefinitions = [...keypointDefinitions];
    newDefinitions[index] = { ...newDefinitions[index], ...definition };
    updateKeypointDefinitions(newDefinitions);
  }, [keypointDefinitions, updateKeypointDefinitions]);

  const resetToDefault = useCallback(() => {
    updateKeypointDefinitions(KEYPOINT_DEFINITIONS);
  }, [updateKeypointDefinitions]);

  const updateBehaviorDefinitions = useCallback((definitions: BehaviorDefinition[]) => {
    setBehaviorDefinitions(definitions);
    localStorage.setItem('behaviorDefinitions', JSON.stringify(definitions));
  }, []);

  const addBehaviorDefinition = useCallback(
    (definition: Omit<BehaviorDefinition, 'id'>) => {
      const newDefinitions = [...behaviorDefinitions];
      const idBase = definition.name.toLowerCase().replace(/\s+/g, '_');
      let id = idBase || `behavior_${Date.now()}`;
      const usedIds = new Set(newDefinitions.map((behavior) => behavior.id));
      if (usedIds.has(id)) {
        id = `${id}_${Math.random().toString(36).slice(2, 7)}`;
      }

      newDefinitions.push({ ...definition, id });
      updateBehaviorDefinitions(newDefinitions);
    },
    [behaviorDefinitions, updateBehaviorDefinitions]
  );

  const removeBehaviorDefinition = useCallback(
    (id: string) => {
      const newDefinitions = behaviorDefinitions.filter((behavior) => behavior.id !== id);
      updateBehaviorDefinitions(newDefinitions);
    },
    [behaviorDefinitions, updateBehaviorDefinitions]
  );

  const updateBehaviorDefinition = useCallback(
    (id: string, definition: Partial<BehaviorDefinition>) => {
      const newDefinitions = behaviorDefinitions.map((behavior) =>
        behavior.id === id ? { ...behavior, ...definition } : behavior
      );
      updateBehaviorDefinitions(newDefinitions);
    },
    [behaviorDefinitions, updateBehaviorDefinitions]
  );

  const resetBehaviorsToDefault = useCallback(() => {
    updateBehaviorDefinitions(DEFAULT_BEHAVIOR_DEFINITIONS);
  }, [updateBehaviorDefinitions]);

  const setAllowBehaviorOverlap = useCallback((allow: boolean) => {
    setAllowBehaviorOverlapState(allow);
    localStorage.setItem('allowBehaviorOverlap', allow ? 'true' : 'false');
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        keypointDefinitions,
        updateKeypointDefinitions,
        addKeypointDefinition,
        removeKeypointDefinition,
        updateKeypointDefinition,
        resetToDefault,
        behaviorDefinitions,
        updateBehaviorDefinitions,
        addBehaviorDefinition,
        removeBehaviorDefinition,
        updateBehaviorDefinition,
        resetBehaviorsToDefault,
        allowBehaviorOverlap,
        setAllowBehaviorOverlap,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}