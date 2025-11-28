'use client';

/**
 * Audio Waveform Visualization Component
 * 
 * Displays real-time audio waveform visualization during voice input.
 * Uses Web Audio API to analyze and render audio frequency data.
 */

import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  analyser: AnalyserNode;
  width?: number;
  height?: number;
  barColor?: string;
  barGap?: number;
}

export function AudioWaveform({ 
  analyser, 
  width = 400, 
  height = 100,
  barColor = '#3B82F6',
  barGap = 2
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = (): void => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.fillStyle = '#F9FAFB';
      ctx.fillRect(0, 0, width, height);

      // Calculate bar width
      const barCount = 50;
      const barWidth = (width / barCount) - barGap;
      const step = Math.floor(bufferLength / barCount);

      // Draw bars
      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * step;
        const barHeight = (dataArray[dataIndex] / 255) * height;
        const x = i * (barWidth + barGap);
        const y = height - barHeight;

        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, y, 0, height);
        gradient.addColorStop(0, barColor);
        gradient.addColorStop(1, `${barColor}80`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, width, height, barColor, barGap]);

  return (
    <div className="flex justify-center items-center p-4 bg-gray-50 rounded-md">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-md"
      />
    </div>
  );
}
