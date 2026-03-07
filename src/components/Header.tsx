import { useRef } from 'react';
import { Upload, Check, Settings, FolderOpen } from 'lucide-react';

interface HeaderProps {
  onVideoUpload: (file: File) => void;
  onOpenSettings: () => void;
  onOpenLibrary: () => void;
  saveStatus: string;
}

export function Header({ onVideoUpload, onOpenSettings, onOpenLibrary, saveStatus }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onVideoUpload(file);
    }
  };

  return (
    <header className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center gap-4">
      <h1 className="text-xl font-bold text-white">
        Mouse Annotation Tool
      </h1>
      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {saveStatus && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm animate-pulse">
            <Check size={16} />
            <span>{saveStatus}</span>
          </div>
        )}

        <button
          onClick={onOpenLibrary}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <FolderOpen size={18} />
          Library
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Settings size={18} />
          Settings
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Upload size={18} />
          Upload Video
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </header>
  );
}
