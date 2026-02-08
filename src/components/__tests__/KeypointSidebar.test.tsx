import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeypointSidebar } from '../KeypointSidebar';
import { KEYPOINT_DEFINITIONS } from '../../constants/keypoints';
import type { Keypoint } from '../../types';

describe('KeypointSidebar', () => {
  const defaultProps = {
    activeKeypoint: 0,
    setActiveKeypoint: vi.fn(),
    keypoints: {} as Record<string, Keypoint>,
    annotationCount: 0,
    progress: 0,
    onRemoveKeypoint: vi.fn(),
    keypointDefinitions: KEYPOINT_DEFINITIONS,
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
    it('renders Keyboard Shortcuts heading', () => {
      render(<KeypointSidebar {...defaultProps} />);
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('displays shortcut for selecting keypoint', () => {
      render(<KeypointSidebar {...defaultProps} />);
      expect(screen.getByText('Select keypoint')).toBeInTheDocument();
    });

    it('displays shortcut for placing point', () => {
      render(<KeypointSidebar {...defaultProps} />);
      expect(screen.getByText('Place point')).toBeInTheDocument();
    });

    it('displays shortcut for next frame', () => {
      render(<KeypointSidebar {...defaultProps} />);
      expect(screen.getByText('Next frame')).toBeInTheDocument();
    });

    it('displays shortcut for previous frame', () => {
      render(<KeypointSidebar {...defaultProps} />);
      expect(screen.getByText('Prev frame')).toBeInTheDocument();
    });

    it('displays shortcut for toggle visible', () => {
      render(<KeypointSidebar {...defaultProps} />);
      expect(screen.getByText('Toggle visible')).toBeInTheDocument();
    });

    it('displays shortcut for copy previous', () => {
      render(<KeypointSidebar {...defaultProps} />);
      expect(screen.getByText('Copy previous')).toBeInTheDocument();
    });

    it('displays shortcut for export', () => {
      render(<KeypointSidebar {...defaultProps} />);
      expect(screen.getByText('Export')).toBeInTheDocument();
    });
  });

  describe('Progress Panel', () => {
    it('renders Progress label', () => {
      render(<KeypointSidebar {...defaultProps} />);
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('displays progress percentage', () => {
      render(<KeypointSidebar {...defaultProps} progress={45} />);
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('displays annotation count', () => {
      render(<KeypointSidebar {...defaultProps} annotationCount={10} />);
      expect(screen.getByText('10 frames annotated')).toBeInTheDocument();
    });

    it('displays zero progress correctly', () => {
      render(<KeypointSidebar {...defaultProps} progress={0} annotationCount={0} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0 frames annotated')).toBeInTheDocument();
    });

    it('displays 100% progress correctly', () => {
      render(<KeypointSidebar {...defaultProps} progress={100} annotationCount={300} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('300 frames annotated')).toBeInTheDocument();
    });
  });
});
