import { SkipBack, SkipForward, Copy, Minus, Plus } from 'lucide-react';
import { FPS } from '../constants/keypoints';

interface ControlBarProps {
  currentFrame: number;
  totalFrames: number;
  navigateFrame: (delta: number) => void;
  copyFromPrevious: () => void;
  showSkeleton: boolean;
  setShowSkeleton: (show: boolean) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  keypointSize: number;
  setKeypointSize: (size: number) => void;
  showKeypointText: boolean;
  setShowKeypointText: (show: boolean) => void;
}

export function ControlBar({
  currentFrame,
  totalFrames,
  navigateFrame,
  copyFromPrevious,
  showSkeleton,
  setShowSkeleton,
  zoom,
  setZoom,
  keypointSize,
  setKeypointSize,
  showKeypointText,
  setShowKeypointText,
}: ControlBarProps) {
  const timestamp = (currentFrame / FPS).toFixed(2);

  return (
    <div className="bg-slate-800 border-t border-slate-700 px-6 py-4">
      {/* Frame Navigation */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={() => navigateFrame(-10)}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          title="Back 10 frames"
        >
          <SkipBack size={20} />
        </button>

        <button
          onClick={() => navigateFrame(-1)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm font-medium"
        >
          ← Prev
        </button>

        <div className="min-w-[200px] text-center">
          <div className="text-lg font-mono">
            <span className="text-violet-400">{currentFrame}</span>
            <span className="text-slate-500 mx-2">/</span>
            <span className="text-slate-400">{totalFrames || '–'}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{timestamp}s</div>
        </div>

        <button
          onClick={() => navigateFrame(1)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm font-medium"
        >
          Next →
        </button>

        <button
          onClick={() => navigateFrame(10)}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          title="Forward 10 frames"
        >
          <SkipForward size={20} />
        </button>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={copyFromPrevious}
          className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Copy size={16} />
          Copy Previous
          <kbd className="text-xs bg-fuchsia-800/50 px-1.5 py-0.5 rounded">C</kbd>
        </button>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={showSkeleton}
                onChange={(e) => setShowSkeleton(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-600 rounded-full peer-checked:bg-violet-600 transition-colors" />
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
            </div>
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
              Show Skeleton
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={showKeypointText}
                onChange={(e) => setShowKeypointText(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-600 rounded-full peer-checked:bg-emerald-600 transition-colors" />
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
            </div>
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
              Show Labels
            </span>
          </label>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Keypoint Size</span>
            <button
              onClick={() => setKeypointSize(Math.max(3, keypointSize - 1))}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              disabled={keypointSize <= 3}
            >
              <Minus size={16} />
            </button>
            <span className="text-sm font-mono min-w-[30px] text-center text-emerald-400">
              {keypointSize}
            </span>
            <button
              onClick={() => setKeypointSize(Math.min(15, keypointSize + 1))}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              disabled={keypointSize >= 15}
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Zoom</span>
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              disabled={zoom <= 0.5}
            >
              <Minus size={16} />
            </button>
            <span className="text-sm font-mono min-w-[50px] text-center text-violet-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              disabled={zoom >= 3}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
