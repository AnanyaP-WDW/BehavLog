import type { BehaviorDefinition, BehaviorInstance } from '../types';

function escapeCsv(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportBehaviorsCsv(
  videoName: string,
  behaviorDefinitions: BehaviorDefinition[],
  behaviors: BehaviorInstance[]
) {
  const behaviorMap = new Map(behaviorDefinitions.map((behavior) => [behavior.id, behavior.name]));

  const header = [
    'behavior_id',
    'behavior_name',
    'start_frame',
    'end_frame',
    'start_time',
    'end_time',
    'duration_frames',
    'duration_seconds',
    'notes',
  ];

  const rows = behaviors.map((behavior) => {
    const name = behaviorMap.get(behavior.behaviorId) || behavior.behaviorId;
    const durationFrames = behavior.endFrame - behavior.startFrame + 1;
    const durationSeconds = behavior.endTimestamp - behavior.startTimestamp;
    return [
      behavior.behaviorId,
      name,
      behavior.startFrame.toString(),
      behavior.endFrame.toString(),
      behavior.startTimestamp.toFixed(3),
      behavior.endTimestamp.toFixed(3),
      durationFrames.toString(),
      durationSeconds.toFixed(3),
      behavior.notes ?? '',
    ].map(escapeCsv);
  });

  const csv = [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${videoName.replace(/\.[^/.]+$/, '')}_behaviors.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
