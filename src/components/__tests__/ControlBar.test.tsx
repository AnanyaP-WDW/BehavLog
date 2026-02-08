import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlBar } from '../ControlBar';

describe('ControlBar', () => {
  const defaultProps = {
    currentFrame: 0,
    totalFrames: 100,
    navigateFrame: vi.fn(),
    copyFromPrevious: vi.fn(),
    showSkeleton: true,
    setShowSkeleton: vi.fn(),
    zoom: 1,
    setZoom: vi.fn(),
    keypointSize: 7,
    setKeypointSize: vi.fn(),
    showKeypointText: true,
    setShowKeypointText: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Frame Navigation', () => {
    it('displays current frame number', () => {
      render(<ControlBar {...defaultProps} currentFrame={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('displays total frames', () => {
      render(<ControlBar {...defaultProps} totalFrames={100} />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('displays dash when no total frames', () => {
      render(<ControlBar {...defaultProps} totalFrames={0} />);
      expect(screen.getByText('–')).toBeInTheDocument();
    });

    it('displays timestamp in seconds', () => {
      render(<ControlBar {...defaultProps} currentFrame={60} />);
      // 60 frames / 30 FPS = 2.00 seconds
      expect(screen.getByText('2.00s')).toBeInTheDocument();
    });

    it('calls navigateFrame with -1 when Prev button clicked', () => {
      const navigateFrame = vi.fn();
      render(<ControlBar {...defaultProps} navigateFrame={navigateFrame} />);
      
      fireEvent.click(screen.getByRole('button', { name: '← Prev' }));
      expect(navigateFrame).toHaveBeenCalledWith(-1);
    });

    it('calls navigateFrame with 1 when Next button clicked', () => {
      const navigateFrame = vi.fn();
      render(<ControlBar {...defaultProps} navigateFrame={navigateFrame} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
      expect(navigateFrame).toHaveBeenCalledWith(1);
    });

    it('calls navigateFrame with -10 when back 10 frames button clicked', () => {
      const navigateFrame = vi.fn();
      render(<ControlBar {...defaultProps} navigateFrame={navigateFrame} />);
      
      const backBtn = screen.getByTitle('Back 10 frames');
      fireEvent.click(backBtn);
      expect(navigateFrame).toHaveBeenCalledWith(-10);
    });

    it('calls navigateFrame with 10 when forward 10 frames button clicked', () => {
      const navigateFrame = vi.fn();
      render(<ControlBar {...defaultProps} navigateFrame={navigateFrame} />);
      
      const forwardBtn = screen.getByTitle('Forward 10 frames');
      fireEvent.click(forwardBtn);
      expect(navigateFrame).toHaveBeenCalledWith(10);
    });
  });

  describe('Copy Previous', () => {
    it('renders Copy Previous button', () => {
      render(<ControlBar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /copy previous/i })).toBeInTheDocument();
    });

    it('calls copyFromPrevious when clicked', () => {
      const copyFromPrevious = vi.fn();
      render(<ControlBar {...defaultProps} copyFromPrevious={copyFromPrevious} />);
      
      fireEvent.click(screen.getByRole('button', { name: /copy previous/i }));
      expect(copyFromPrevious).toHaveBeenCalledTimes(1);
    });

    it('shows keyboard shortcut C', () => {
      render(<ControlBar {...defaultProps} />);
      expect(screen.getByText('C')).toBeInTheDocument();
    });
  });

  describe('Skeleton Toggle', () => {
    it('renders Show Skeleton label', () => {
      render(<ControlBar {...defaultProps} />);
      expect(screen.getByText('Show Skeleton')).toBeInTheDocument();
    });

    it('checkbox is checked when showSkeleton is true', () => {
      render(<ControlBar {...defaultProps} showSkeleton={true} />);
      const checkboxes = screen.getAllByRole('checkbox');
      // First checkbox is showSkeleton
      expect(checkboxes[0]).toBeChecked();
    });

    it('checkbox is unchecked when showSkeleton is false', () => {
      render(<ControlBar {...defaultProps} showSkeleton={false} />);
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).not.toBeChecked();
    });

    it('calls setShowSkeleton when toggled', () => {
      const setShowSkeleton = vi.fn();
      render(<ControlBar {...defaultProps} setShowSkeleton={setShowSkeleton} showSkeleton={false} />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      expect(setShowSkeleton).toHaveBeenCalledWith(true);
    });
  });

  describe('Zoom Controls', () => {
    it('displays current zoom percentage', () => {
      render(<ControlBar {...defaultProps} zoom={1.5} />);
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('displays Zoom label', () => {
      render(<ControlBar {...defaultProps} />);
      expect(screen.getByText('Zoom')).toBeInTheDocument();
    });

    it('calls setZoom with decreased value when minus clicked', () => {
      const setZoom = vi.fn();
      render(<ControlBar {...defaultProps} setZoom={setZoom} zoom={1} />);
      
      // Get all buttons and find the zoom minus button
      const buttons = screen.getAllByRole('button');
      // Order: back10, prev, next, fwd10, copyPrev, kpSizeMinus, kpSizePlus, zoomMinus, zoomPlus
      const minusBtn = buttons[7];
      fireEvent.click(minusBtn);
      
      expect(setZoom).toHaveBeenCalledWith(0.75);
    });

    it('calls setZoom with increased value when plus clicked', () => {
      const setZoom = vi.fn();
      render(<ControlBar {...defaultProps} setZoom={setZoom} zoom={1} />);
      
      // Get all buttons and find the zoom plus button
      const buttons = screen.getAllByRole('button');
      const plusBtn = buttons[8];
      fireEvent.click(plusBtn);
      
      expect(setZoom).toHaveBeenCalledWith(1.25);
    });
  });
});
