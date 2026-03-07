import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeypointSidebar } from '../KeypointSidebar';
import { KEYPOINT_DEFINITIONS } from '../../constants/keypoints';
import { DEFAULT_BEHAVIOR_DEFINITIONS } from '../../constants/behaviors';
import type { Keypoint } from '../../types';

describe('KeypointSidebar', () => {
  const defaultProps = {
    activeKeypoint: 0,
    setActiveKeypoint: vi.fn(),
    keypoints: {} as Record<string, Keypoint>,
    onRemoveKeypoint: vi.fn(),
    keypointDefinitions: KEYPOINT_DEFINITIONS,
    behaviorDefinitions: DEFAULT_BEHAVIOR_DEFINITIONS,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Keypoints List', () => {
    it('renders Keypoints heading', () => {
      render(<KeypointSidebar {...defaultProps} />);
      expect(screen.getByText('Keypoints')).toBeInTheDocument();
    });

    it('renders all keypoint definitions', () => {
      render(<KeypointSidebar {...defaultProps} />);
      
      KEYPOINT_DEFINITIONS.forEach((kp) => {
        const displayName = kp.name.replace(/_/g, ' ');
        expect(screen.getByText(displayName)).toBeInTheDocument();
      });
    });

    it('renders keyboard shortcuts for each keypoint', () => {
      render(<KeypointSidebar {...defaultProps} />);
      
      // Check that all keypoints are rendered with their keyboard shortcuts
      // Use getAllByText since some keys appear multiple times (in keypoint list and shortcuts panel)
      KEYPOINT_DEFINITIONS.forEach((kp) => {
        const elements = screen.getAllByText(kp.key);
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('highlights active keypoint', () => {
      render(<KeypointSidebar {...defaultProps} activeKeypoint={2} />);
      
      // The active keypoint has a parent div with bg-violet-600 class
      const keypointName = KEYPOINT_DEFINITIONS[2].name.replace(/_/g, ' ');
      const activeElement = screen.getByText(keypointName).closest('button');

      expect(activeElement?.parentElement).toHaveClass('bg-violet-600');
    });

    it('calls setActiveKeypoint when keypoint is clicked', () => {
      const setActiveKeypoint = vi.fn();
      render(<KeypointSidebar {...defaultProps} setActiveKeypoint={setActiveKeypoint} />);
      
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[3]);
      
      expect(setActiveKeypoint).toHaveBeenCalledWith(3);
    });

    it('shows check mark for placed keypoints', () => {
      const keypoints: Record<string, Keypoint> = {
        nose: { x: 100, y: 100, visible: true, confidence: 1.0 },
        left_ear: { x: 150, y: 100, visible: true, confidence: 1.0 },
      };
      
      render(<KeypointSidebar {...defaultProps} keypoints={keypoints} />);
      
      // Check marks should be rendered for placed keypoints
      const checkIcons = document.querySelectorAll('svg');
      expect(checkIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Keyboard Shortcuts Panel', () => {
    function renderAndExpand() {
      render(<KeypointSidebar {...defaultProps} />);
      fireEvent.click(screen.getByText('Keyboard Shortcuts'));
    }

    it('renders collapsed by default', () => {
      render(<KeypointSidebar {...defaultProps} />);
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.queryByText('Select keypoint')).not.toBeInTheDocument();
    });

    it('expands on click and shows all shortcuts', () => {
      renderAndExpand();
      expect(screen.getByText('Select keypoint')).toBeInTheDocument();
      expect(screen.getByText('Place point')).toBeInTheDocument();
      expect(screen.getByText('Next frame')).toBeInTheDocument();
      expect(screen.getByText('Prev frame')).toBeInTheDocument();
      expect(screen.getByText('Toggle visible')).toBeInTheDocument();
      expect(screen.getByText('Copy previous')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('shows behavior shortcuts when expanded', () => {
      renderAndExpand();
      DEFAULT_BEHAVIOR_DEFINITIONS.forEach((b) => {
        expect(screen.getByText(b.name)).toBeInTheDocument();
      });
      expect(screen.getByText('Stop recording')).toBeInTheDocument();
      expect(screen.getByText('Undo')).toBeInTheDocument();
      expect(screen.getByText('Redo')).toBeInTheDocument();
    });

    it('collapses when clicked again', () => {
      renderAndExpand();
      expect(screen.getByText('Select keypoint')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Keyboard Shortcuts'));
      expect(screen.queryByText('Select keypoint')).not.toBeInTheDocument();
    });
  });
});
