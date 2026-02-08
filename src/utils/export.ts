import type { AnnotationDataWithBehaviors, BehaviorDefinition, BehaviorInstance, Keypoint } from '../types';
import { FPS } from '../constants/keypoints';

export function exportAnnotations(
  videoName: string,
  resolution: [number, number],
  annotations: Record<number, Record<string, Keypoint>>,
  behaviorDefinitions: BehaviorDefinition[],
  behaviors: BehaviorInstance[]
): void {
  const data: AnnotationDataWithBehaviors = {
    video_name: videoName,
    fps: FPS,
    resolution,
    annotations: Object.entries(annotations)
      .map(([frameIdx, keypoints]) => ({
        frame_idx: parseInt(frameIdx),
        timestamp: parseInt(frameIdx) / FPS,
        keypoints,
      }))
      .sort((a, b) => a.frame_idx - b.frame_idx),
    behavior_definitions: behaviorDefinitions,
    behaviors,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${videoName.replace(/\.[^/.]+$/, '')}_annotations.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
