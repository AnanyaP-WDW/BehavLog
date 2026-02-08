import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { SettingsProvider } from './contexts/SettingsContext';

// Mock the hooks to avoid complex video/canvas interactions
vi.mock('./hooks/useAnnotationState', () => ({
  useAnnotationState: () => ({
    videoUrl: null,
    videoName: '',
    videoId: null,
    currentFrame: 0,
    totalFrames: 0,
    keypoints: {},
    activeKeypoint: 0,
    annotations: {},
    zoom: 1,
    showSkeleton: true,
    saveStatus: '',
    keypointSize: 7,
    showKeypointText: true,
    setActiveKeypoint: vi.fn(),
    setZoom: vi.fn(),
    setShowSkeleton: vi.fn(),
    setSaveStatus: vi.fn(),
    setKeypointSize: vi.fn(),
    setShowKeypointText: vi.fn(),
    handleVideoUpload: vi.fn(),
    handleVideoLoaded: vi.fn(),
    navigateFrame: vi.fn(),
    seekFrame: vi.fn(),
    placeKeypoint: vi.fn(),
    toggleVisibility: vi.fn(),
    copyFromPrevious: vi.fn(),
    removeKeypoint: vi.fn(),
    loadStoredVideo: vi.fn(),
    getResolution: vi.fn(() => [0, 0]),
    getAnnotationCount: vi.fn(() => 0),
    getProgress: vi.fn(() => 0),
    getAllAnnotations: vi.fn(() => ({})),
    saveCurrentFrame: vi.fn(),
    autoSaveAnnotations: vi.fn(),
  }),
}));

vi.mock('./hooks/useBehaviorState', () => ({
  useBehaviorState: () => ({
    behaviors: [],
    activeBehavior: null,
    recordingStartFrame: null,
    toggleRecording: vi.fn(),
    stopRecording: vi.fn(),
    updateBehavior: vi.fn(),
    deleteBehavior: vi.fn(),
    resetBehaviors: vi.fn(),
    loadStoredBehaviors: vi.fn(),
    undoBehaviors: vi.fn(),
    redoBehaviors: vi.fn(),
    canUndo: false,
    canRedo: false,
  }),
}));

vi.mock('./hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: () => ({
    handleSave: vi.fn(),
  }),
}));

describe('App', () => {
  it('renders the main application layout', () => {
    render(
      <SettingsProvider>
        <App />
      </SettingsProvider>
    );
    
    // Check for main title
    expect(screen.getByText('Mouse Annotation Tool')).toBeInTheDocument();
  });

  it('renders the Header component', () => {
    render(
      <SettingsProvider>
        <App />
      </SettingsProvider>
    );
    
    expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('renders the KeypointSidebar component', () => {
    render(
      <SettingsProvider>
        <App />
      </SettingsProvider>
    );
    
    expect(screen.getByText('Keypoints')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('renders the ControlBar component', () => {
    render(
      <SettingsProvider>
        <App />
      </SettingsProvider>
    );
    
    expect(screen.getByRole('button', { name: '← Prev' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next →' })).toBeInTheDocument();
    expect(screen.getByText('Show Skeleton')).toBeInTheDocument();
    expect(screen.getByText('Zoom')).toBeInTheDocument();
  });

  it('renders upload prompt when no video is loaded', () => {
    render(
      <SettingsProvider>
        <App />
      </SettingsProvider>
    );
    
    expect(screen.getByText('Upload a video to start')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop or click the Upload button')).toBeInTheDocument();
  });

  it('has all keypoint buttons in sidebar', () => {
    render(
      <SettingsProvider>
        <App />
      </SettingsProvider>
    );
    
    // Check for some keypoint names
    expect(screen.getByText('nose')).toBeInTheDocument();
    expect(screen.getByText('left ear')).toBeInTheDocument();
    expect(screen.getByText('right ear')).toBeInTheDocument();
    expect(screen.getByText('neck')).toBeInTheDocument();
    expect(screen.getByText('tail base')).toBeInTheDocument();
  });

  it('displays frame counter', () => {
    render(
      <SettingsProvider>
        <App />
      </SettingsProvider>
    );
    
    // Frame counter should show 0
    const frameElements = screen.getAllByText('0');
    expect(frameElements.length).toBeGreaterThan(0);
  });

  it('disables export when no video is loaded', () => {
    render(
      <SettingsProvider>
        <App />
      </SettingsProvider>
    );
    
    const exportBtn = screen.getByRole('button', { name: /export/i });
    expect(exportBtn).toBeDisabled();
  });

  it('renders with correct base styling', () => {
    const { container } = render(
      <SettingsProvider>
        <App />
      </SettingsProvider>
    );
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('h-screen', 'w-screen', 'bg-slate-900');
  });
});

