import { useState } from 'react';
import { X, Play, Trash2, Calendar, Clock, Monitor } from 'lucide-react';
import { useVideoStorage } from '../hooks/useVideoStorage';
import type { StoredVideo } from '../utils/database';

interface VideoGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (video: StoredVideo, videoUrl: string) => void;
}

export function VideoGallery({ isOpen, onClose, onSelectVideo }: VideoGalleryProps) {
  const { videos, isLoading, error, deleteVideo, getVideoUrl } = useVideoStorage();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectVideo = (video: StoredVideo) => {
    const videoUrl = getVideoUrl(video);
    onSelectVideo(video, videoUrl);
    onClose();
  };

  const handleDeleteVideo = async (video: StoredVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm(`Are you sure you want to delete "${video.name}"? This action cannot be undone.`)) {
      const success = await deleteVideo(video.id);
      if (success && selectedVideo === video.id) {
        setSelectedVideo(null);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatResolution = (resolution: [number, number]) => {
    return `${resolution[0]} × ${resolution[1]}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Video Library</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
              <span className="ml-3 text-slate-400">Loading videos...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!isLoading && !error && videos.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
                <Play size={24} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">No videos yet</h3>
              <p className="text-slate-500">Upload a video to get started with annotations</p>
            </div>
          )}

          {!isLoading && !error && videos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`bg-slate-700/50 rounded-lg overflow-hidden cursor-pointer transition-all hover:bg-slate-700 ${
                    selectedVideo === video.id ? 'ring-2 ring-violet-500' : ''
                  }`}
                  onClick={() => setSelectedVideo(video.id)}
                  onDoubleClick={() => handleSelectVideo(video)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-slate-800 relative">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play size={32} className="text-slate-500" />
                      </div>
                    )}
                    
                    {/* Duration overlay */}
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                      {formatDuration(video.duration)}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteVideo(video, e)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete video"
                    >
                      <Trash2 size={14} className="text-white" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-white truncate mb-2" title={video.name}>
                      {video.name}
                    </h3>
                    
                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} />
                        <span>{formatDate(video.uploadDate)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Monitor size={12} />
                        <span>{formatResolution(video.resolution)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock size={12} />
                        <span>{formatDuration(video.duration)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedVideo && (
          <div className="flex justify-between items-center p-6 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Double-click a video to open it, or click the button below
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const video = videos.find(v => v.id === selectedVideo);
                  if (video) handleSelectVideo(video);
                }}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors text-white font-medium"
              >
                Open Video
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}