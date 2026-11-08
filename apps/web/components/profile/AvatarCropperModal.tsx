'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Upload, AlertCircle, Loader2 } from 'lucide-react';

interface AvatarCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => Promise<void>;
  isUr?: boolean;
}

export const AvatarCropperModal: React.FC<AvatarCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  isUr = false,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  // Pointer drag controls for positioning
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleApplyCrop = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Create an offscreen canvas for square 400x400 output
      const canvas = document.createElement('canvas');
      const size = 400;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (!ctx || !imageRef.current) {
        throw new Error('Canvas rendering context unavailable');
      }

      const img = imageRef.current;

      // Draw background
      ctx.fillStyle = '#100B26';
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      // Center canvas coordinates
      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Offset ratio: map viewport 256px to canvas 400px
      const scaleFactor = size / 256;
      ctx.translate(position.x * scaleFactor, position.y * scaleFactor);

      // Draw the image centered
      const drawWidth = 256 * scaleFactor;
      const drawHeight = (img.naturalHeight / img.naturalWidth) * drawWidth;
      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

      ctx.restore();

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      await onCropComplete(croppedDataUrl);
      onClose();
    } catch (err: any) {
      console.error('Crop save error:', err);
      setError(err?.message || 'Failed to save cropped image.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#140E2E] border border-white/15 p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF2E74] to-[#A855F7] flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold">
              {isUr ? 'پروفائل تصویر ایڈجسٹ کریں' : 'Adjust Profile Picture'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Viewport Frame */}
        <div className="my-6 flex flex-col items-center justify-center">
          <p className="text-xs text-white/60 mb-3 text-center">
            {isUr
              ? 'تصویر کو پوزیشن میں لانے کے لیے ڈریگ کریں اور زوم سلائیڈر استعمال کریں'
              : 'Drag to position and use slider to zoom into the circular avatar'}
          </p>

          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-[#FF2E74] shadow-[0_0_35px_rgba(255,46,116,0.45)] bg-[#0A061C] cursor-grab active:cursor-grabbing select-none flex items-center justify-center touch-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop Preview"
              draggable={false}
              className="max-w-none transition-transform duration-75 pointer-events-none"
              style={{
                width: '100%',
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              }}
            />

            {/* Circular Grid Target Overlay */}
            <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
          </div>
        </div>

        {/* Zoom & Rotation Controls */}
        <div className="space-y-4 px-2">
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-white/60" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FF2E74]"
            />
            <ZoomIn className="w-4 h-4 text-white/60" />
            <span className="text-xs font-mono text-white/80 w-10 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-white/60 pt-1">
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{isUr ? 'گھمائیں (90°)' : 'Rotate 90°'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPosition({ x: 0, y: 0 });
                setRotation(0);
              }}
              className="px-3 py-1.5 rounded-xl hover:text-white transition-colors"
            >
              {isUr ? 'ری سیٹ' : 'Reset Position'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            {isUr ? 'منسوخ کریں' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF2E74] to-[#A855F7] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-[#FF2E74]/30 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isUr ? 'محفوظ ہو رہا ہے...' : 'Applying Crop...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isUr ? 'تصویر لاگو کریں' : 'Apply & Save'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
