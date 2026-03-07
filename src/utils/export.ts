import type {
  AnnotationData,
  AnnotationDataWithBehaviors,
  BehaviorDefinition,
  BehaviorInstance,
  Keypoint,
  ProjectExportData,
  ProjectSummary,
  ProjectExportVideo,
  StoredVideoRecord,
} from '../types';
import { FPS } from '../constants/keypoints';

function sanitizeBaseName(name: string): string {
  return name.replace(/\.[^/.]+$/, '');
}

function buildFrameAnnotations(annotations: Record<number, Record<string, Keypoint>>) {
  return Object.entries(annotations)
    .map(([frameIdx, keypoints]) => ({
      frame_idx: parseInt(frameIdx, 10),
      timestamp: parseInt(frameIdx, 10) / FPS,
      keypoints,
    }))
    .sort((a, b) => a.frame_idx - b.frame_idx);
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildVideoAnnotationExport(
  videoName: string,
  resolution: [number, number],
  annotations: Record<number, Record<string, Keypoint>>,
  behaviorDefinitions: BehaviorDefinition[],
  behaviors: BehaviorInstance[]
): AnnotationDataWithBehaviors {
  return {
    video_name: videoName,
    fps: FPS,
    resolution,
    annotations: buildFrameAnnotations(annotations),
    behavior_definitions: behaviorDefinitions,
    behaviors,
  };
}

export function buildStoredVideoAnnotationExport(
  video: Pick<StoredVideoRecord, 'name' | 'resolution'>,
  annotationData: AnnotationData | null,
  behaviorDefinitions: BehaviorDefinition[],
  behaviors: BehaviorInstance[]
): AnnotationDataWithBehaviors {
  return {
    video_name: annotationData?.video_name ?? video.name,
    fps: annotationData?.fps ?? FPS,
    resolution: annotationData?.resolution ?? video.resolution,
    annotations: annotationData?.annotations ?? [],
    behavior_definitions: behaviorDefinitions,
    behaviors,
  };
}

export function exportVideoAnnotation(data: AnnotationDataWithBehaviors): void {
  downloadJson(`${sanitizeBaseName(data.video_name)}_annotations.json`, data);
}

export function buildProjectExportData(
  project: ProjectSummary,
  videos: ProjectExportVideo[]
): ProjectExportData {
  return {
    project,
    videos,
  };
}

export function exportProjectAnnotations(project: ProjectSummary, videos: ProjectExportVideo[]): void {
  const data = buildProjectExportData(project, videos);
  downloadJson(`${sanitizeBaseName(project.name)}_project_annotations.json`, data);
}

export function exportAnnotations(
  videoName: string,
  resolution: [number, number],
  annotations: Record<number, Record<string, Keypoint>>,
  behaviorDefinitions: BehaviorDefinition[],
  behaviors: BehaviorInstance[]
): void {
  exportVideoAnnotation(
    buildVideoAnnotationExport(videoName, resolution, annotations, behaviorDefinitions, behaviors)
  );
}
