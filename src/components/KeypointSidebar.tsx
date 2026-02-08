import { Check, X } from 'lucide-react';
import type { Keypoint, KeypointDefinition } from '../types';

interface KeypointSidebarProps {
  activeKeypoint: number;
  setActiveKeypoint: (index: number) => void;
  keypoints: Record<string, Keypoint>;
  annotationCount: number;
  progress: number;
  onRemoveKeypoint: (keypointName?: string) => void;
  keypointDefinitions: KeypointDefinition[];
}

export function KeypointSidebar({
  activeKeypoint,
  setActiveKeypoint,
  keypoints,
  annotationCount,
  progress,
  onRemoveKeypoint,
  keypointDefinitions,
}: KeypointSidebarProps) {
  return (
    <aside className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Keypoints List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Keypoints
        </h3>
        <div className="space-y-1.5">
          {keypointDefinitions.map((kp, idx) => {
            const isActive = activeKeypoint === idx;
            const isPlaced = keypoints[kp.name]?.visible;

            return (
              <div
                key={kp.name}
                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <button
                  onClick={() => setActiveKeypoint(idx)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <div
                    className="w-4 h-4 rounded-full ring-2 ring-white/20"
                    style={{ backgroundColor: kp.color }}
                  />
                  <span className="flex-1 text-sm font-medium">{kp.name.replace(/_/g, ' ')}</span>
                  <kbd
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-violet-500' : 'bg-slate-600'
                    }`}
                  >
                    {kp.key}
                  </kbd>
                  {isPlaced && (
                    <Check
                      size={16}
                      className={isActive ? 'text-white' : 'text-emerald-400'}
                    />
                  )}
                </button>
                {isPlaced && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveKeypoint(kp.name);
                    }}
                    className={`p-1 rounded transition-colors ${
                      isActive 
                        ? 'hover:bg-red-500 text-red-200 hover:text-white' 
                        : 'hover:bg-red-600 text-red-400 hover:text-white'
                    }`}
                    title="Remove keypoint"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Shortcuts Panel */}
      <div className="p-4 border-t border-slate-700">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Keyboard Shortcuts
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <ShortcutItem keys={['1', '-', '0']} action="Select keypoint" />
          <ShortcutItem keys={['Click']} action="Place point" />
          <ShortcutItem keys={['Space']} action="Next frame" />
          <ShortcutItem keys={['⇧', 'Space']} action="Prev frame" />
          <ShortcutItem keys={['V']} action="Toggle visible" />
          <ShortcutItem keys={['C']} action="Copy previous" />
          <ShortcutItem keys={['Del']} action="Remove point" />
          <ShortcutItem keys={['⌘', 'S']} action="Export" />
        </div>
      </div>

      {/* Progress Panel */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Progress</span>
          <span className="text-sm font-mono text-emerald-400">{progress}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {annotationCount} frames annotated
        </p>
      </div>
    </aside>
  );
}

function ShortcutItem({ keys, action }: { keys: string[]; action: string }) {
  return (
    <>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 min-w-[20px] text-center"
          >
            {key}
          </kbd>
        ))}
      </div>
      <span className="text-slate-400">{action}</span>
    </>
  );
}
