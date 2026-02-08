import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { BehaviorDefinition, BehaviorInstance } from '../types';

interface BehaviorTimelineProps {
  behaviors: BehaviorInstance[];
  behaviorDefinitions: BehaviorDefinition[];
  currentFrame: number;
  totalFrames: number;
  activeBehavior: string | null;
  recordingStartFrame: number | null;
  onSeek: (frame: number) => void;
  onUpdateBehavior: (id: string, updates: Partial<BehaviorInstance>) => void;
  onSelectBehavior: (id: string | null) => void;
  selectedBehaviorId: string | null;
}

function clampFrame(frame: number, totalFrames: number) {
  if (totalFrames <= 0) return 0;
  return Math.max(0, Math.min(frame, totalFrames - 1));
}

function toPercent(frame: number, totalFrames: number) {
  if (totalFrames <= 1) return 0;
  return (frame / (totalFrames - 1)) * 100;
}

export function BehaviorTimeline({
  behaviors,
  behaviorDefinitions,
  currentFrame,
  totalFrames,
  activeBehavior,
  recordingStartFrame,
  onSeek,
  onUpdateBehavior,
  onSelectBehavior,
  selectedBehaviorId,
}: BehaviorTimelineProps) {
  const trackRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [dragState, setDragState] = useState<{
    id: string;
    edge: 'start' | 'end';
    behaviorId: string;
  } | null>(null);

  const behaviorsByDefinition = useMemo(() => {
    const map = new Map<string, BehaviorInstance[]>();
    behaviorDefinitions.forEach((behavior) => {
      map.set(behavior.id, []);
    });
    behaviors.forEach((behavior) => {
      const list = map.get(behavior.behaviorId);
      if (list) {
        list.push(behavior);
      }
    });
    return map;
  }, [behaviors, behaviorDefinitions]);
  const handleSeek = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const ratio = rect.width === 0 ? 0 : offset / rect.width;
    onSeek(clampFrame(Math.round(ratio * (totalFrames - 1)), totalFrames));
    onSelectBehavior(null);
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (event: globalThis.MouseEvent) => {
      const track = trackRefs.current[dragState.behaviorId];
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const offset = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
      const ratio = rect.width === 0 ? 0 : offset / rect.width;
      const frame = clampFrame(Math.round(ratio * (totalFrames - 1)), totalFrames);
      if (dragState.edge === 'start') {
        onUpdateBehavior(dragState.id, { startFrame: Math.min(frame, totalFrames - 1) });
      } else {
        onUpdateBehavior(dragState.id, { endFrame: Math.max(frame, 0) });
      }
    };

    const handleUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragState, onUpdateBehavior, totalFrames]);

  return (
    <div className="bg-slate-800 border-t border-slate-700 px-6 py-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Behavior Timeline
        </h4>
        <span className="text-xs text-slate-500">
          Frame {currentFrame} / {totalFrames || '–'}
        </span>
      </div>

      <div className="space-y-2">
        {behaviorDefinitions.map((behavior) => {
          const behaviorInstances = behaviorsByDefinition.get(behavior.id) ?? [];
          const isActive = activeBehavior === behavior.id;
          const pendingStart = recordingStartFrame ?? currentFrame;
          const pendingStartFrame = clampFrame(Math.min(pendingStart, currentFrame), totalFrames);
          const pendingEndFrame = clampFrame(Math.max(pendingStart, currentFrame), totalFrames);

          return (
            <div key={behavior.id} className="grid grid-cols-[140px_1fr] items-center gap-3">
              <div className="text-xs text-slate-300 truncate">{behavior.name}</div>
              <div
                ref={(node) => {
                  trackRefs.current[behavior.id] = node;
                }}
                className="relative h-6 bg-slate-700/60 rounded-md overflow-hidden cursor-pointer"
                onClick={handleSeek}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    onSeek(clampFrame(currentFrame, totalFrames));
                  }
                }}
              >
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-violet-400"
                  style={{ left: `${toPercent(currentFrame, totalFrames)}%` }}
                />

                {behaviorInstances.map((instance) => {
                  const start = toPercent(instance.startFrame, totalFrames);
                  const end = toPercent(instance.endFrame, totalFrames);
                  const width = Math.max(0.5, end - start);
                  return (
                    <div
                      key={instance.id}
                      className={`absolute top-1 bottom-1 rounded-sm opacity-90 ${
                        selectedBehaviorId === instance.id ? 'ring-2 ring-white/70' : ''
                      }`}
                      style={{
                        left: `${start}%`,
                        width: `${width}%`,
                        backgroundColor: behavior.color,
                      }}
                      title={`${behavior.name} (${instance.startFrame} - ${instance.endFrame})`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectBehavior(instance.id);
                      }}
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize bg-white/40"
                        onMouseDown={(event) => {
                          event.stopPropagation();
                          setDragState({ id: instance.id, edge: 'start', behaviorId: behavior.id });
                        }}
                      />
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize bg-white/40"
                        onMouseDown={(event) => {
                          event.stopPropagation();
                          setDragState({ id: instance.id, edge: 'end', behaviorId: behavior.id });
                        }}
                      />
                    </div>
                  );
                })}

                {isActive && recordingStartFrame !== null && (
                  <div
                    className="absolute top-1 bottom-1 rounded-sm opacity-70 border border-white/40"
                    style={{
                      left: `${toPercent(pendingStartFrame, totalFrames)}%`,
                      width: `${Math.max(
                        0.5,
                        toPercent(pendingEndFrame, totalFrames) - toPercent(pendingStartFrame, totalFrames)
                      )}%`,
                      backgroundColor: behavior.color,
                    }}
                    title={`${behavior.name} (recording...)`}
                  />
                )}
              </div>
            </div>
          );
        })}

        {behaviorDefinitions.length === 0 && (
          <div className="text-xs text-slate-500">No behaviors configured.</div>
        )}
      </div>
    </div>
  );
}
