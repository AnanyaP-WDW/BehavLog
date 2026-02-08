import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';

describe('Header', () => {
  const defaultProps = {
    onVideoUpload: vi.fn(),
    onExport: vi.fn(),
    onOpenSettings: vi.fn(),
    onOpenLibrary: vi.fn(),
    saveStatus: '',
    hasVideo: false,
  };

  it('renders the application title', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Mouse Annotation Tool')).toBeInTheDocument();
  });

  it('renders Upload Video button', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument();
  });

  it('renders Export button', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('disables Export button when no video is loaded', () => {
    render(<Header {...defaultProps} hasVideo={false} />);
    const exportBtn = screen.getByRole('button', { name: /export/i });
    expect(exportBtn).toBeDisabled();
  });

  it('enables Export button when video is loaded', () => {
    render(<Header {...defaultProps} hasVideo={true} />);
    const exportBtn = screen.getByRole('button', { name: /export/i });
    expect(exportBtn).not.toBeDisabled();
  });

  it('calls onExport when Export button is clicked', () => {
    const onExport = vi.fn();
    render(<Header {...defaultProps} onExport={onExport} hasVideo={true} />);
    
    fireEvent.click(screen.getByRole('button', { name: /export/i }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('displays save status when provided', () => {
    render(<Header {...defaultProps} saveStatus="Saved successfully" />);
    expect(screen.getByText('Saved successfully')).toBeInTheDocument();
  });

  it('does not display save status when empty', () => {
    render(<Header {...defaultProps} saveStatus="" />);
    expect(screen.queryByText('Saved successfully')).not.toBeInTheDocument();
  });

  it('handles file upload when file is selected', () => {
    const onVideoUpload = vi.fn();
    render(<Header {...defaultProps} onVideoUpload={onVideoUpload} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    
    const file = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(onVideoUpload).toHaveBeenCalledWith(file);
  });

  it('accepts video files only', () => {
    render(<Header {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('accept', 'video/*');
  });

  it('shows keyboard shortcut for export', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('⌘S')).toBeInTheDocument();
  });
});
