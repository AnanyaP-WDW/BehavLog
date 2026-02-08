import { useRef, useEffect, useCallback, useState, type RefObject } from 'react';
import { Upload } from 'lucide-react';
import type { Keypoint, KeypointDefinition } from '../types';
import { SKELETON_CONNECTIONS } from '../constants/keypoints';

interface AnnotationCanvasProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoUrl: string | null;
  keypoints: Record<string, Keypoint>;
  activeKeypoint: number;
  showSkeleton: boolean;
  zoom: number;
  keypointSize: number;
  showKeypointText: boolean;
  keypointDefinitions: KeypointDefinition[];
  onVideoLoaded: () => void;
  onPlaceKeypoint: (x: number, y: number) => void;
  onVideoUpload: (file: File) => void;
}

export function AnnotationCanvas({
  videoRef,
  videoUrl,
  keypoints,
  activeKeypoint,
  showSkeleton,
  zoom,
  keypointSize,
  showKeypointText,
  keypointDefinitions,
  onVideoLoaded,
  onPlaceKeypoint,
  onVideoUpload,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0);

    // Draw skeleton connections
    if (showSkeleton) {
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      SKELETON_CONNECTIONS.forEach(([kp1, kp2]) => {
        const p1 = keypoints[kp1];
        const p2 = keypoints[kp2];
        if (p1?.visible && p2?.visible) {
          const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          const color1 = keypointDefinitions.find((k) => k.name === kp1)?.color || '#fff';
          const color2 = keypointDefinitions.find((k) => k.name === kp2)?.color || '#fff';
          gradient.addColorStop(0, color1);
          gradient.addColorStop(1, color2);
          ctx.strokeStyle = gradient;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });
    }

    // Draw keypoints
    keypointDefinitions.forEach((kpDef, idx) => {
      const kp = keypoints[kpDef.name];
      if (kp && kp.visible) {
        const isActive = idx === activeKeypoint;
        const radius = isActive ? keypointSize + 3 : keypointSize;

        // Outer glow for active
        if (isActive) {
          ctx.shadowColor = kpDef.color;
          ctx.shadowBlur = 15;
        } else {
          ctx.shadowBlur = 0;
        }

        // Main circle
        ctx.fillStyle = kpDef.color;
        ctx.strokeStyle = isActive ? '#fff' : 'rgba(0,0,0,0.5)';
        ctx.lineWidth = isActive ? 3 : 2;

        ctx.beginPath();
        ctx.arc(kp.x, kp.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Reset shadow
        ctx.shadowBlur = 0;

        // Label (only if showKeypointText is true)
        if (showKeypointText) {
          ctx.font = 'bold 12px Inter, system-ui, sans-serif';
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          ctx.lineWidth = 3;
          const label = kpDef.name.replace(/_/g, ' ');
          ctx.strokeText(label, kp.x + 14, kp.y + 4);
          ctx.fillText(label, kp.x + 14, kp.y + 4);
        }
      }
    });
  }, [keypoints, activeKeypoint, showSkeleton, keypointSize, showKeypointText, keypointDefinitions, videoRef]);

  // Redraw on state changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle video time updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => drawCanvas();
    const handleSeeked = () => drawCanvas();

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [drawCanvas, videoRef]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    onPlaceKeypoint(x, y);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      onVideoUpload(file);
    }
  };

  if (!videoUrl) {
    return (
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 flex items-center justify-center bg-slate-900 transition-colors ${
          isDragging ? 'bg-violet-900/20 ring-2 ring-violet-500 ring-inset' : ''
        }`}
      >
        <div className="text-center">
          <div
            className={`w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all ${
              isDragging
                ? 'bg-violet-600 scale-110'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <Upload size={40} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-300 mb-2">
            {isDragging ? 'Drop video here' : 'Upload a video to start'}
          </h2>
          <p className="text-slate-500 text-sm">
            Drag & drop or click the Upload button
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center bg-slate-900 overflow-auto p-4"
    >
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
        }}
        className="relative transition-transform"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-w-full max-h-full"
          onLoadedMetadata={onVideoLoaded}
          muted
        />
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="absolute top-0 left-0 w-full h-full cursor-crosshair"
        />
      </div>
    </div>
  );
}
