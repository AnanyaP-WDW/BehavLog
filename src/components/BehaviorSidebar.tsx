import { Circle, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import type { BehaviorDefinition, BehaviorInstance } from '../types';

interface BehaviorSidebarProps {
  behaviorDefinitions: BehaviorDefinition[];
  behaviors: BehaviorInstance[];
  activeBehavior: string | null;
  recordingStartFrame: number | null;
  currentFrame: number;
  selectedBehaviorId: string | null;
  onToggleRecording: (behaviorId: string) => void;
  onStopRecording: () => void;
  onDeleteBehavior: (id: string) => void;
  onSelectBehavior: (id: string | null) => void;
  onUpdateBehavior: (id: string, updates: Partial<BehaviorInstance>) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function BehaviorSidebar({
  behaviorDefinitions,
  behaviors,
  activeBehavior,
  recordingStartFrame,
  currentFrame,
  selectedBehaviorId,
  onToggleRecording,
  onStopRecording,
  onDeleteBehavior,
  onSelectBehavior,
  onUpdateBehavior,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: BehaviorSidebarProps) {
  const behaviorCounts = behaviors.reduce<Record<string, number>>((acc, behavior) => {
    acc[behavior.behaviorId] = (acc[behavior.behaviorId] || 0) + 1;
    return acc;
  }, {});

  return (
    <aside className="w-72 bg-slate-800 border-l border-slate-700 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Behaviors
          </h3>
          <div className="flex items-center gap-2">
            {activeBehavior && (
              <button
                onClick={onStopRecording}
                className="flex items-center gap-1 text-xs text-rose-300 bg-rose-500/20 px-2 py-1 rounded"
              >
                <PauseCircle size={12} />
                Stop
              </button>
            )}
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="text-xs text-slate-300 bg-slate-700 px-2 py-1 rounded hover:bg-slate-600 disabled:opacity-50"
            >
              Undo
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="text-xs text-slate-300 bg-slate-700 px-2 py-1 rounded hover:bg-slate-600 disabled:opacity-50"
            >
              Redo
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          {behaviorDefinitions.map((behavior) => {
            const isActive = activeBehavior === behavior.id;
            const count = behaviorCounts[behavior.id] || 0;
            return (
              <button
                key={behavior.id}
                onClick={() => onToggleRecording(behavior.id)}
                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full ring-2 ring-white/20"
                  style={{ backgroundColor: behavior.color }}
                />
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{behavior.name}</span>
                    <kbd
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    >
                      {behavior.key.toUpperCase()}
                    </kbd>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {count} instance{count === 1 ? '' : 's'}
                  </div>
                </div>
                <PlayCircle size={16} className={isActive ? 'text-white' : 'text-emerald-400'} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-800/80">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Recording
        </h4>
        {activeBehavior ? (
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Circle size={10} className="text-rose-400 animate-pulse" />
              <span>Recording</span>
            </div>
            <div>
              Start frame: <span className="font-mono text-emerald-400">{recordingStartFrame}</span>
            </div>
            <div>
              Current frame: <span className="font-mono text-violet-400">{currentFrame}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Press a behavior key to start recording.</p>
        )}
      </div>

      <div className="p-4 border-t border-slate-700">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Selected Behavior
        </h4>
        {selectedBehaviorId ? (
          (() => {
            const selected = behaviors.find((behavior) => behavior.id === selectedBehaviorId);
            if (!selected) {
              return <p className="text-xs text-slate-500">Behavior not found.</p>;
            }
            const label =
              behaviorDefinitions.find((behavior) => behavior.id === selected.behaviorId)?.name ??
              selected.behaviorId;
            return (
              <div className="space-y-2 text-xs text-slate-300">
                <div className="font-medium text-slate-200">{label}</div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400">Start</span>
                    <input
                      type="number"
                      value={selected.startFrame}
                      onChange={(event) =>
                        onUpdateBehavior(selected.id, { startFrame: parseInt(event.target.value, 10) || 0 })
                      }
                      className="w-full rounded bg-slate-700 border border-slate-600 px-2 py-1 text-xs text-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400">End</span>
                    <input
                      type="number"
                      value={selected.endFrame}
                      onChange={(event) =>
                        onUpdateBehavior(selected.id, { endFrame: parseInt(event.target.value, 10) || 0 })
                      }
                      className="w-full rounded bg-slate-700 border border-slate-600 px-2 py-1 text-xs text-slate-100"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-slate-400">Notes</span>
                  <textarea
                    value={selected.notes ?? ''}
                    onChange={(event) => onUpdateBehavior(selected.id, { notes: event.target.value })}
                    rows={3}
                    className="w-full rounded bg-slate-700 border border-slate-600 px-2 py-1 text-xs text-slate-100"
                  />
                </label>
              </div>
            );
          })()
        ) : (
          <p className="text-xs text-slate-500">Select a behavior segment to edit notes.</p>
        )}
      </div>

      <div className="p-4 border-t border-slate-700">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Recent Behaviors
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {behaviors.slice(-5).reverse().map((behavior) => (
            <div key={behavior.id} className="flex items-center justify-between text-xs">
              <button
                onClick={() => onSelectBehavior(behavior.id)}
                className={`text-left flex-1 ${
                  selectedBehaviorId === behavior.id ? 'text-emerald-300' : 'text-slate-300'
                }`}
              >
                {behaviorDefinitions.find((b) => b.id === behavior.behaviorId)?.name ?? behavior.behaviorId}
              </button>
              <button
                onClick={() => onDeleteBehavior(behavior.id)}
                className="text-rose-400 hover:text-rose-300"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {behaviors.length === 0 && <p className="text-xs text-slate-500">No behaviors yet.</p>}
        </div>
      </div>
    </aside>
  );
}
