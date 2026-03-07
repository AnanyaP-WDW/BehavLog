import { useRef, useState } from 'react';
import { Header } from './components/Header';
import { KeypointSidebar } from './components/KeypointSidebar';
import { BehaviorSidebar } from './components/BehaviorSidebar';
import { AnnotationCanvas } from './components/AnnotationCanvas';
import { ControlBar } from './components/ControlBar';
import { BehaviorTimeline } from './components/BehaviorTimeline';
import { SettingsModal } from './components/SettingsModal';
import { VideoGallery } from './components/VideoGallery';
import { useAnnotationState } from './hooks/useAnnotationState';
import { useBehaviorState } from './hooks/useBehaviorState';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSettings } from './contexts/SettingsContext';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedBehaviorId, setSelectedBehaviorId] = useState<string | null>(null);
  const { keypointDefinitions, behaviorDefinitions, allowBehaviorOverlap } = useSettings();

  const {
    videoUrl,
    videoName,
    videoId,
    currentFrame,
    totalFrames,
    keypoints,
    activeKeypoint,
    zoom,
    showSkeleton,
    saveStatus,
    keypointSize,
    showKeypointText,
    setActiveKeypoint,
    setZoom,
    setShowSkeleton,
    setSaveStatus,
    setKeypointSize,
    setShowKeypointText,
    handleVideoUpload,
    handleVideoLoaded,
    navigateFrame,
    placeKeypoint,
    toggleVisibility,
    copyFromPrevious,
    removeKeypoint,
    loadStoredVideo,
    getResolution,
    getAllAnnotations,
    seekFrame,
  } = useAnnotationState(videoRef, keypointDefinitions);

  const {
    behaviors,
    activeBehavior,
    recordingStartFrame,
    toggleRecording,
    stopRecording,
    updateBehavior,
    deleteBehavior,
    resetBehaviors,
    loadStoredBehaviors,
    undoBehaviors,
    redoBehaviors,
    canUndo,
    canRedo,
  } = useBehaviorState({ videoId, behaviorDefinitions, allowBehaviorOverlap });

  const handleVideoUploadWithBehaviors = (file: File) => {
    resetBehaviors();
    setSelectedBehaviorId(null);
    handleVideoUpload(file);
  };

  const handleLoadStoredVideo = async (video: any, videoUrlToLoad: string) => {
    await loadStoredVideo(video, videoUrlToLoad);
    await loadStoredBehaviors(video.id);
    setSelectedBehaviorId(null);
  };

  const { handleSave } = useKeyboardShortcuts({
    setActiveKeypoint,
    navigateFrame,
    toggleVisibility,
    copyFromPrevious,
    removeKeypoint,
    videoName,
    getResolution,
    getAllAnnotations,
    setSaveStatus,
    keypointDefinitions,
    behaviorDefinitions,
    behaviors,
    toggleBehaviorRecording: (behaviorId) => toggleRecording(behaviorId, currentFrame),
    stopBehaviorRecording: () => stopRecording(currentFrame),
    undoBehaviors,
    redoBehaviors,
  });

  return (
    <div className="h-screen w-screen bg-slate-900 text-white flex flex-col overflow-hidden">
      <Header
        onVideoUpload={handleVideoUploadWithBehaviors}
        onExport={handleSave}
        onOpenSettings={() => setShowSettings(true)}
        onOpenLibrary={() => setShowLibrary(true)}
        saveStatus={saveStatus}
        hasVideo={!!videoUrl}
      />

      <div className="flex flex-1 overflow-hidden">
        <KeypointSidebar
          activeKeypoint={activeKeypoint}
          setActiveKeypoint={setActiveKeypoint}
          keypoints={keypoints}
          onRemoveKeypoint={removeKeypoint}
          keypointDefinitions={keypointDefinitions}
          behaviorDefinitions={behaviorDefinitions}
        />

        <div className="flex-1 flex flex-col">
          <AnnotationCanvas
            videoRef={videoRef}
            videoUrl={videoUrl}
            keypoints={keypoints}
            activeKeypoint={activeKeypoint}
            showSkeleton={showSkeleton}
            zoom={zoom}
            keypointSize={keypointSize}
            showKeypointText={showKeypointText}
            keypointDefinitions={keypointDefinitions}
            onVideoLoaded={handleVideoLoaded}
            onPlaceKeypoint={placeKeypoint}
            onVideoUpload={handleVideoUploadWithBehaviors}
          />

          <BehaviorTimeline
            behaviors={behaviors}
            behaviorDefinitions={behaviorDefinitions}
            currentFrame={currentFrame}
            totalFrames={totalFrames}
            activeBehavior={activeBehavior}
            recordingStartFrame={recordingStartFrame}
            onSeek={seekFrame}
            onUpdateBehavior={updateBehavior}
            onSelectBehavior={setSelectedBehaviorId}
            selectedBehaviorId={selectedBehaviorId}
          />

          <ControlBar
            currentFrame={currentFrame}
            totalFrames={totalFrames}
            navigateFrame={navigateFrame}
            copyFromPrevious={copyFromPrevious}
            showSkeleton={showSkeleton}
            setShowSkeleton={setShowSkeleton}
            zoom={zoom}
            setZoom={setZoom}
            keypointSize={keypointSize}
            setKeypointSize={setKeypointSize}
            showKeypointText={showKeypointText}
            setShowKeypointText={setShowKeypointText}
          />
        </div>

        <BehaviorSidebar
          behaviorDefinitions={behaviorDefinitions}
          behaviors={behaviors}
          activeBehavior={activeBehavior}
          recordingStartFrame={recordingStartFrame}
          currentFrame={currentFrame}
          selectedBehaviorId={selectedBehaviorId}
          onToggleRecording={(behaviorId) => toggleRecording(behaviorId, currentFrame)}
          onStopRecording={() => stopRecording(currentFrame)}
          onDeleteBehavior={(id) => {
            if (selectedBehaviorId === id) {
              setSelectedBehaviorId(null);
            }
            deleteBehavior(id);
          }}
          onSelectBehavior={setSelectedBehaviorId}
          onUpdateBehavior={updateBehavior}
          onUndo={undoBehaviors}
          onRedo={redoBehaviors}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <VideoGallery
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelectVideo={handleLoadStoredVideo}
      />
    </div>
  );
}

export default App;
