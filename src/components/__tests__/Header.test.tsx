import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';

describe('Header', () => {
  const defaultProps = {
    onVideoUpload: vi.fn(),
    onOpenSettings: vi.fn(),
    onOpenLibrary: vi.fn(),
    saveStatus: '',
  };

  it('renders the application title', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Mouse Annotation Tool')).toBeInTheDocument();
  });

  it('renders Upload Video button', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument();
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

  it('does not render an export button', () => {
    render(<Header {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();
  });
});
