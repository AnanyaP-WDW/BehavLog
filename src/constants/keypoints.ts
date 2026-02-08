import type { KeypointDefinition, SkeletonConnection } from '../types';

export const KEYPOINT_DEFINITIONS: KeypointDefinition[] = [
  { name: 'nose', color: '#ef4444', key: '1' },
  { name: 'left_ear', color: '#f97316', key: '2' },
  { name: 'right_ear', color: '#eab308', key: '3' },
  { name: 'neck', color: '#22c55e', key: '4' },
  { name: 'spine_mid', color: '#3b82f6', key: '5' },
  { name: 'tail_base', color: '#6366f1', key: '6' },
  { name: 'left_front_paw', color: '#a855f7', key: '7' },
  { name: 'right_front_paw', color: '#ec4899', key: '8' },
  { name: 'left_hind_paw', color: '#14b8a6', key: '9' },
  { name: 'right_hind_paw', color: '#84cc16', key: '0' },
];

export const SKELETON_CONNECTIONS: SkeletonConnection[] = [
  ['nose', 'neck'],
  ['neck', 'left_ear'],
  ['neck', 'right_ear'],
  ['neck', 'spine_mid'],
  ['spine_mid', 'tail_base'],
  ['neck', 'left_front_paw'],
  ['neck', 'right_front_paw'],
  ['spine_mid', 'left_hind_paw'],
  ['spine_mid', 'right_hind_paw'],
];

export const FPS = 30;
