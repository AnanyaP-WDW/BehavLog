export interface Keypoint {
  x: number;
  y: number;
  visible: boolean;
  confidence: number;
}

export interface KeypointDefinition {
  name: string;
  color: string;
  key: string;
}

export interface FrameAnnotation {
  frame_idx: number;
  timestamp: number;
  keypoints: Record<string, Keypoint>;
}

export interface AnnotationData {
  video_name: string;
  fps: number;
  resolution: [number, number];
  annotations: FrameAnnotation[];
}

export interface BehaviorDefinition {
  id: string;
  name: string;
  color: string;
  key: string;
  category?: string;
  description?: string;
}

export interface BehaviorInstance {
  id: string;
  behaviorId: string;
  startFrame: number;
  endFrame: number;
  startTimestamp: number;
  endTimestamp: number;
  notes?: string;
}

export interface AnnotationDataWithBehaviors extends AnnotationData {
  behavior_definitions: BehaviorDefinition[];
  behaviors: BehaviorInstance[];
}

export type SkeletonConnection = [string, string];
