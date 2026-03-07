import { describe, expect, it } from 'vitest';
import type { ProjectSummary, StoredVideoRecord } from '../types';
import {
  buildProjectExportData,
  buildStoredVideoAnnotationExport,
  buildVideoAnnotationExport,
} from './export';

describe('export helpers', () => {
  it('builds the current single-video export format from frame annotations', () => {
    const result = buildVideoAnnotationExport(
      'rat-session.mp4',
      [1920, 1080],
      {
        5: {
          nose: { x: 10, y: 20, visible: true, confidence: 0.9 },
        },
      },
      [{ id: 'grooming', name: 'Grooming', color: '#fff', key: 'g' }],
      [
        {
          id: 'behavior-1',
          behaviorId: 'grooming',
          startFrame: 5,
          endFrame: 10,
          startTimestamp: 5 / 30,
          endTimestamp: 10 / 30,
        },
      ]
    );

    expect(result.video_name).toBe('rat-session.mp4');
    expect(result.resolution).toEqual([1920, 1080]);
    expect(result.annotations).toHaveLength(1);
    expect(result.annotations[0].frame_idx).toBe(5);
    expect(result.behavior_definitions).toHaveLength(1);
    expect(result.behaviors).toHaveLength(1);
  });

  it('builds a stored-video export even when no saved annotations exist', () => {
    const video = {
      id: 'video-1',
      projectId: 'project-1',
      name: 'rat-session.mp4',
      blob: new Blob(['video']),
      createdAt: new Date('2026-03-07T10:00:00Z'),
      lastModified: new Date('2026-03-07T11:00:00Z'),
      duration: 120,
      resolution: [1280, 720] as [number, number],
      annotationState: 'not_started' as const,
    } satisfies StoredVideoRecord;

    const result = buildStoredVideoAnnotationExport(video, null, [], []);

    expect(result.video_name).toBe('rat-session.mp4');
    expect(result.fps).toBe(30);
    expect(result.resolution).toEqual([1280, 720]);
    expect(result.annotations).toEqual([]);
    expect(result.behaviors).toEqual([]);
  });

  it('builds project export data with project metadata and per-video payloads', () => {
    const project: ProjectSummary = {
      id: 'project-1',
      name: 'Rat Study',
      createdAt: new Date('2026-03-07T10:00:00Z'),
      lastModified: new Date('2026-03-07T11:00:00Z'),
      videoCount: 1,
    };

    const result = buildProjectExportData(project, [
      {
        id: 'video-1',
        name: 'rat-session.mp4',
        createdAt: new Date('2026-03-07T10:00:00Z'),
        lastModified: new Date('2026-03-07T11:00:00Z'),
        duration: 120,
        resolution: [1280, 720],
        annotationState: 'in_progress',
        annotationData: {
          video_name: 'rat-session.mp4',
          fps: 30,
          resolution: [1280, 720],
          annotations: [],
          behavior_definitions: [],
          behaviors: [],
        },
      },
    ]);

    expect(result.project.name).toBe('Rat Study');
    expect(result.videos).toHaveLength(1);
    expect(result.videos[0].annotationData.video_name).toBe('rat-session.mp4');
  });
});
