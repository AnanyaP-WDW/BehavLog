import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  Clock,
  Download,
  FileVideo,
  FolderOpen,
  FolderPlus,
  Monitor,
  Play,
  Trash2,
  X,
} from 'lucide-react';
import { useVideoStorage } from '../hooks/useVideoStorage';
import {
  buildStoredVideoAnnotationExport,
  exportProjectAnnotations,
  exportVideoAnnotation,
} from '../utils/export';
import type { ProjectExportVideo, StoredVideoRecord, VideoAnnotationState } from '../types';

interface VideoGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (video: StoredVideoRecord, videoUrl: string) => void;
  activeProjectId: string | null;
  mode: 'browse' | 'selectProjectForUpload';
  pendingUploadName: string | null;
  onSelectProject: (projectId: string | null) => void;
  onProjectDeleted: (projectId: string) => void;
  onProjectReadyForUpload: (projectId: string) => void;
}

const annotationStateLabel: Record<VideoAnnotationState, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

export function VideoGallery({
  isOpen,
  onClose,
  onSelectVideo,
  activeProjectId,
  mode,
  pendingUploadName,
  onSelectProject,
  onProjectDeleted,
  onProjectReadyForUpload,
}: VideoGalleryProps) {
  const {
    projects,
    videos,
    isLoading,
    error,
    createProject,
    deleteProject,
    deleteVideo,
    getVideoUrl,
    loadVideoExportData,
    refreshProjects,
    refreshVideos,
  } = useVideoStorage();
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExportingProject, setIsExportingProject] = useState(false);
  const [exportingVideoId, setExportingVideoId] = useState<string | null>(null);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [activeProjectId, projects]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void refreshProjects();
  }, [isOpen, refreshProjects]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void refreshVideos(activeProjectId ?? undefined);
  }, [activeProjectId, isOpen, refreshVideos]);

  const handleSelectVideo = (video: StoredVideoRecord) => {
    const videoUrl = getVideoUrl(video);
    onSelectVideo(video, videoUrl);
    onClose();
  };

  const handleDeleteVideo = async (video: StoredVideoRecord, e: React.MouseEvent) => {
    e.stopPropagation();

    if (confirm(`Are you sure you want to delete "${video.name}"? This action cannot be undone.`)) {
      const success = await deleteVideo(video.id);
      if (success && expandedVideoId === video.id) {
        setExpandedVideoId(null);
      }
    }
  };

  const handleExportVideo = async (video: StoredVideoRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setExportError(null);
    setExportingVideoId(video.id);

    try {
      const { annotationData, storedBehaviors } = await loadVideoExportData(video.id);
      const exportData = buildStoredVideoAnnotationExport(
        video,
        annotationData,
        storedBehaviors?.behaviorDefinitions ?? [],
        storedBehaviors?.behaviors ?? []
      );
      exportVideoAnnotation(exportData);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export video annotations');
    } finally {
      setExportingVideoId(null);
    }
  };

  const handleExportProject = async () => {
    if (!activeProject) {
      return;
    }

    setExportError(null);
    setIsExportingProject(true);

    try {
      const projectVideos: ProjectExportVideo[] = await Promise.all(
        videos.map(async (video) => {
          const { annotationData, storedBehaviors } = await loadVideoExportData(video.id);

          return {
            id: video.id,
            name: video.name,
            createdAt: video.createdAt,
            lastModified: video.lastModified,
            duration: video.duration,
            resolution: video.resolution,
            annotationState: video.annotationState,
            annotationData: buildStoredVideoAnnotationExport(
              video,
              annotationData,
              storedBehaviors?.behaviorDefinitions ?? [],
              storedBehaviors?.behaviors ?? []
            ),
          };
        })
      );

      exportProjectAnnotations(activeProject, projectVideos);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export project annotations');
    } finally {
      setIsExportingProject(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const projectId = await createProject(newProjectName);
    if (!projectId) {
      return;
    }

    setNewProjectName('');
    onSelectProject(projectId);

    if (mode === 'selectProjectForUpload') {
      onProjectReadyForUpload(projectId);
      return;
    }

    await refreshVideos(projectId);
  };

  const handleDeleteProject = async (projectId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Delete project "${name}" and all its videos? This cannot be undone.`)) {
      return;
    }

    const success = await deleteProject(projectId);
    if (!success) {
      return;
    }

    onProjectDeleted(projectId);
    if (activeProjectId === projectId) {
      onSelectProject(null);
      setExpandedVideoId(null);
      await refreshVideos(undefined);
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

  const useSelectedProjectForUpload = () => {
    if (activeProjectId) {
      onProjectReadyForUpload(activeProjectId);
    }
  };

  const displayedError = exportError ?? error;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Project Library</h2>
            {mode === 'selectProjectForUpload' && pendingUploadName && (
              <p className="text-sm text-slate-400 mt-1">
                Select or create a project for `{pendingUploadName}`
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
              <span className="ml-3 text-slate-400">Loading library...</span>
            </div>
          )}

          {displayedError && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
              <p className="text-red-400">{displayedError}</p>
            </div>
          )}

          {!isLoading && !displayedError && (
            <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
              <section className="bg-slate-900/40 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FolderOpen size={18} className="text-violet-400" />
                  <h3 className="text-sm font-semibold text-white">Projects</h3>
                </div>

                <form onSubmit={handleCreateProject} className="flex gap-2 mb-4">
                  <input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="New project name"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors text-white text-sm font-medium"
                  >
                    <FolderPlus size={16} />
                    Create
                  </button>
                </form>

                {projects.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-700 px-4 py-8 text-center">
                    <p className="text-sm text-slate-400">Create a project to start organizing videos.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => onSelectProject(project.id)}
                        className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                          activeProjectId === project.id
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800'
                        }`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectProject(project.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{project.name}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {project.videoCount} video{project.videoCount === 1 ? '' : 's'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Delete project"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="mt-3 space-y-1 text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <Calendar size={12} />
                            <span>Created {formatDate(project.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={12} />
                            <span>Updated {formatDate(project.lastModified)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-slate-900/40 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {activeProject ? activeProject.name : 'Project Resources'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeProject
                        ? 'Videos and annotation metadata stored in this project'
                        : 'Select a project to browse its videos'}
                    </p>
                  </div>
                  {activeProject && (
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-slate-400">
                        {activeProject.videoCount} resource{activeProject.videoCount === 1 ? '' : 's'}
                      </div>
                      {mode === 'browse' && (
                        <button
                          type="button"
                          onClick={handleExportProject}
                          disabled={videos.length === 0 || isExportingProject}
                          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg transition-colors text-white text-sm font-medium"
                        >
                          <Download size={16} />
                          {isExportingProject ? 'Exporting...' : 'Export Project'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {!activeProject && (
                  <div className="rounded-lg border border-dashed border-slate-700 px-4 py-12 text-center">
                    <p className="text-sm text-slate-400">Choose a project to view its videos.</p>
                  </div>
                )}

                {activeProject && videos.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-700 px-4 py-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
                      <FileVideo size={20} className="text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-300">No videos in this project yet.</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Upload a video to start annotating this project.
                    </p>
                  </div>
                )}

                {activeProject && videos.length > 0 && (
                  <div className="space-y-3">
                    {videos.map((video) => {
                      const isExpanded = expandedVideoId === video.id;

                      return (
                        <div
                          key={video.id}
                          className="rounded-lg border border-slate-700 bg-slate-800/60 overflow-hidden"
                        >
                          <div className="px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">{video.name}</p>
                                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                  <span className="px-2 py-1 rounded-full bg-slate-700 text-slate-200">
                                    {annotationStateLabel[video.annotationState]}
                                  </span>
                                  <span className="px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                                    {formatDuration(video.duration)}
                                  </span>
                                  <span className="px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                                    {formatResolution(video.resolution)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleSelectVideo(video)}
                                  className="px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors text-white text-sm font-medium"
                                >
                                  Open
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => void handleExportVideo(video, e)}
                                  disabled={exportingVideoId === video.id || isExportingProject}
                                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg transition-colors text-white text-sm font-medium"
                                >
                                  {exportingVideoId === video.id ? 'Exporting...' : 'Export'}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteVideo(video, e)}
                                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                                  title="Delete video"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedVideoId(isExpanded ? null : video.id)
                                  }
                                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                  title="Toggle metadata"
                                >
                                  <ChevronDown
                                    size={16}
                                    className={isExpanded ? 'rotate-180 transition-transform' : 'transition-transform'}
                                  />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
                              <div className="flex items-center gap-2">
                                <Clock size={12} />
                                <span>Updated {formatDate(video.lastModified)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Monitor size={12} />
                                <span>{formatResolution(video.resolution)}</span>
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-slate-700 px-4 py-3 bg-slate-900/30">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400">
                                <div className="flex items-center gap-2">
                                  <Calendar size={12} />
                                  <span>Created {formatDate(video.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock size={12} />
                                  <span>Last modified {formatDate(video.lastModified)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Monitor size={12} />
                                  <span>Resolution {formatResolution(video.resolution)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Play size={12} />
                                  <span>Duration {formatDuration(video.duration)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-6 border-t border-slate-700">
          <p className="text-sm text-slate-400">
            {mode === 'selectProjectForUpload'
              ? 'Choose a project to continue uploading the selected video.'
              : isExportingProject
                ? 'Preparing project export from stored annotations and metadata.'
                : exportingVideoId
                  ? 'Preparing video export from stored annotations and metadata.'
                  : 'Projects keep related videos and annotation metadata together.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
            >
              {mode === 'selectProjectForUpload' ? 'Cancel Upload' : 'Close'}
            </button>
            {mode === 'selectProjectForUpload' && (
              <button
                onClick={useSelectedProjectForUpload}
                disabled={!activeProjectId}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium"
              >
                Use Selected Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}