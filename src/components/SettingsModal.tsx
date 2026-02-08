import { useState } from 'react';
import { X, Plus, Trash2, RotateCcw } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import type { BehaviorDefinition, KeypointDefinition } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#6366f1', '#a855f7', '#ec4899', '#14b8a6', '#84cc16',
  '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#f43f5e'
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    keypointDefinitions,
    addKeypointDefinition,
    removeKeypointDefinition,
    updateKeypointDefinition,
    resetToDefault,
    behaviorDefinitions,
    addBehaviorDefinition,
    removeBehaviorDefinition,
    updateBehaviorDefinition,
    resetBehaviorsToDefault,
    allowBehaviorOverlap,
    setAllowBehaviorOverlap,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<'keypoints' | 'behaviors'>('keypoints');
  const [newKeypointName, setNewKeypointName] = useState('');
  const [newKeypointColor, setNewKeypointColor] = useState('#ef4444');
  const [newBehaviorName, setNewBehaviorName] = useState('');
  const [newBehaviorColor, setNewBehaviorColor] = useState('#22c55e');
  const [newBehaviorKey, setNewBehaviorKey] = useState('');
  const [newBehaviorCategory, setNewBehaviorCategory] = useState('');

  if (!isOpen) return null;

  const handleAddKeypoint = () => {
    if (newKeypointName.trim()) {
      addKeypointDefinition({
        name: newKeypointName.trim().toLowerCase().replace(/\s+/g, '_'),
        color: newKeypointColor,
      });
      setNewKeypointName('');
      setNewKeypointColor('#ef4444');
    }
  };

  const handleUpdateKeypoint = (index: number, field: keyof KeypointDefinition, value: string) => {
    updateKeypointDefinition(index, { [field]: value });
  };

  const handleAddBehavior = () => {
    if (newBehaviorName.trim() && newBehaviorKey.trim()) {
      addBehaviorDefinition({
        name: newBehaviorName.trim(),
        key: newBehaviorKey.trim().slice(0, 1).toLowerCase(),
        color: newBehaviorColor,
        category: newBehaviorCategory.trim() || undefined,
      });
      setNewBehaviorName('');
      setNewBehaviorKey('');
      setNewBehaviorColor('#22c55e');
      setNewBehaviorCategory('');
    }
  };

  const handleUpdateBehavior = (
    id: string,
    field: keyof BehaviorDefinition,
    value: string
  ) => {
    updateBehaviorDefinition(id, { [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Settings</h2>
            <div className="flex items-center bg-slate-700/70 rounded-lg p-1 text-sm">
              <button
                onClick={() => setActiveTab('keypoints')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'keypoints' ? 'bg-violet-600 text-white' : 'text-slate-300'
                }`}
              >
                Keypoints
              </button>
              <button
                onClick={() => setActiveTab('behaviors')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'behaviors' ? 'bg-emerald-600 text-white' : 'text-slate-300'
                }`}
              >
                Behaviors
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'keypoints' ? (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Current Keypoints</h3>
                  <button
                    onClick={resetToDefault}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                  >
                    <RotateCcw size={16} />
                    Reset to Default
                  </button>
                </div>

                <div className="space-y-3">
                  {keypointDefinitions.map((kp, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                      <input
                        type="color"
                        value={kp.color}
                        onChange={(e) => handleUpdateKeypoint(index, 'color', e.target.value)}
                        className="w-8 h-8 rounded border-2 border-slate-600"
                      />

                      <input
                        type="text"
                        value={kp.name}
                        onChange={(e) => handleUpdateKeypoint(index, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />

                      <input
                        type="text"
                        value={kp.key}
                        onChange={(e) => handleUpdateKeypoint(index, 'key', e.target.value.slice(0, 1))}
                        className="w-12 px-2 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                        maxLength={1}
                      />

                      <button
                        onClick={() => removeKeypointDefinition(index)}
                        className="p-2 hover:bg-red-600 rounded-lg transition-colors text-red-400 hover:text-white"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-4">Add New Keypoint</h3>

                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <input
                    type="color"
                    value={newKeypointColor}
                    onChange={(e) => setNewKeypointColor(e.target.value)}
                    className="w-8 h-8 rounded border-2 border-slate-600"
                  />

                  <input
                    type="text"
                    value={newKeypointName}
                    onChange={(e) => setNewKeypointName(e.target.value)}
                    placeholder="Keypoint name"
                    className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeypoint()}
                  />

                  <button
                    onClick={handleAddKeypoint}
                    disabled={!newKeypointName.trim()}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white text-sm font-medium"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-slate-400 mb-2">Quick colors:</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewKeypointColor(color)}
                        className="w-6 h-6 rounded border-2 border-slate-600 hover:border-white transition-colors"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Current Behaviors</h3>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={allowBehaviorOverlap}
                        onChange={(e) => setAllowBehaviorOverlap(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-emerald-500"
                      />
                      Allow overlap
                    </label>
                    <button
                      onClick={resetBehaviorsToDefault}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                    >
                      <RotateCcw size={16} />
                      Reset to Default
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {behaviorDefinitions.map((behavior) => (
                    <div key={behavior.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                      <input
                        type="color"
                        value={behavior.color}
                        onChange={(e) => handleUpdateBehavior(behavior.id, 'color', e.target.value)}
                        className="w-8 h-8 rounded border-2 border-slate-600"
                      />

                      <input
                        type="text"
                        value={behavior.name}
                        onChange={(e) => handleUpdateBehavior(behavior.id, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />

                      <input
                        type="text"
                        value={behavior.key}
                        onChange={(e) =>
                          handleUpdateBehavior(behavior.id, 'key', e.target.value.slice(0, 1).toLowerCase())
                        }
                        className="w-12 px-2 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        maxLength={1}
                      />

                      <input
                        type="text"
                        value={behavior.category ?? ''}
                        onChange={(e) => handleUpdateBehavior(behavior.id, 'category', e.target.value)}
                        placeholder="Category"
                        className="w-28 px-2 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />

                      <button
                        onClick={() => removeBehaviorDefinition(behavior.id)}
                        className="p-2 hover:bg-red-600 rounded-lg transition-colors text-red-400 hover:text-white"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-4">Add New Behavior</h3>

                <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <input
                    type="color"
                    value={newBehaviorColor}
                    onChange={(e) => setNewBehaviorColor(e.target.value)}
                    className="w-8 h-8 rounded border-2 border-slate-600"
                  />

                  <input
                    type="text"
                    value={newBehaviorName}
                    onChange={(e) => setNewBehaviorName(e.target.value)}
                    placeholder="Behavior name"
                    className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddBehavior()}
                  />

                  <input
                    type="text"
                    value={newBehaviorKey}
                    onChange={(e) => setNewBehaviorKey(e.target.value.slice(0, 1).toLowerCase())}
                    placeholder="Key"
                    className="w-16 px-2 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    maxLength={1}
                  />

                  <button
                    onClick={handleAddBehavior}
                    disabled={!newBehaviorName.trim() || !newBehaviorKey.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white text-sm font-medium"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="mt-4">
                  <input
                    type="text"
                    value={newBehaviorCategory}
                    onChange={(e) => setNewBehaviorCategory(e.target.value)}
                    placeholder="Optional category (e.g., locomotion)"
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
                  />
                </div>

                <div className="mt-4">
                  <p className="text-sm text-slate-400 mb-2">Quick colors:</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewBehaviorColor(color)}
                        className="w-6 h-6 rounded border-2 border-slate-600 hover:border-white transition-colors"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}