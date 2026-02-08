import type { BehaviorDefinition } from '../types';

export const DEFAULT_BEHAVIOR_DEFINITIONS: BehaviorDefinition[] = [
  { id: 'grooming', name: 'Grooming', color: '#ef4444', key: 'g' },
  { id: 'eating', name: 'Eating', color: '#f97316', key: 'e' },
  { id: 'drinking', name: 'Drinking', color: '#3b82f6', key: 'd' },
  { id: 'sniffing', name: 'Sniffing', color: '#22c55e', key: 's' },
  { id: 'rearing_unsupported', name: 'Rear (unsupported)', color: '#a855f7', key: 'r' },
  { id: 'rearing_wall', name: 'Rear (wall)', color: '#ec4899', key: 'w' },
  { id: 'walking', name: 'Walking', color: '#14b8a6', key: 'a' },
  { id: 'freezing', name: 'Freezing', color: '#6366f1', key: 'f' },
];
