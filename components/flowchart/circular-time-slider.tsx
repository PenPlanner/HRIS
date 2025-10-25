"use client"

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CircularTimeSliderProps {
  value: number; // Time in minutes
  onChange: (minutes: number) => void;
  maxMinutes?: number; // Maximum minutes (default 180 = 3 hours)
  step?: number; // Step in minutes (default 5)
}

export function CircularTimeSlider({
  value,
  onChange,
  maxMinutes = 180,
  step = 5
}: CircularTimeSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const radius = 80; // Radius of the circle

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCenter({
        x: rect.width / 2,
        y: rect.height / 2
      });
    }
  }, []);

  const getAngleFromPoint = (clientX: number, clientY: number): number => {
    if (!containerRef.current) return 0;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left - center.x;
    const y = clientY - rect.top - center.y;

    // Calculate angle in degrees (0° at top, clockwise)
    let angle = Math.atan2(x, -y) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    return angle;
  };

  const getMinutesFromAngle = (angle: number): number => {
    // Convert angle (0-360) to minutes (0-maxMinutes)
    let minutes = Math.round((angle / 360) * maxMinutes);

    // Snap to step
    minutes = Math.round(minutes / step) * step;

    // Ensure within bounds
    return Math.max(0, Math.min(maxMinutes, minutes));
  };

  const getAngleFromMinutes = (minutes: number): number => {
    return (minutes / maxMinutes) * 360;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    const angle = getAngleFromPoint(clientX, clientY);
    const newMinutes = getMinutesFromAngle(angle);
    onChange(newMinutes);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX, e.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const currentAngle = getAngleFromMinutes(value);
  const knobX = center.x + radius * Math.sin(currentAngle * Math.PI / 180);
  const knobY = center.y - radius * Math.cos(currentAngle * Math.PI / 180);

  // Format time display
  const formatTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  // Generate tick marks (every 15 minutes for example)
  const tickInterval = 15; // minutes
  const numberOfTicks = Math.floor(maxMinutes / tickInterval);
  const ticks = Array.from({ length: numberOfTicks }, (_, i) => {
    const tickMinutes = (i + 1) * tickInterval;
    const tickAngle = getAngleFromMinutes(tickMinutes);
    const innerRadius = radius - 8;
    const outerRadius = radius + 2;

    const x1 = center.x + innerRadius * Math.sin(tickAngle * Math.PI / 180);
    const y1 = center.y - innerRadius * Math.cos(tickAngle * Math.PI / 180);
    const x2 = center.x + outerRadius * Math.sin(tickAngle * Math.PI / 180);
    const y2 = center.y - outerRadius * Math.cos(tickAngle * Math.PI / 180);

    return { x1, y1, x2, y2, minutes: tickMinutes };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Time Display */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-3 w-full">
        <div className="text-center">
          <p className="text-xs text-blue-600 font-medium mb-1">Selected Time</p>
          <div className="text-3xl font-bold font-mono text-blue-900">
            {formatTime(value)}
          </div>
        </div>
      </div>

      {/* Circular Slider */}
      <div
        ref={containerRef}
        className="relative w-52 h-52 select-none touch-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <svg width="100%" height="100%" className="absolute inset-0">
          {/* Background circle */}
          <circle
            cx={center.x}
            cy={center.y}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />

          {/* Progress arc */}
          <circle
            cx={center.x}
            cy={center.y}
            r={radius}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * radius}`}
            strokeDashoffset={`${2 * Math.PI * radius * (1 - currentAngle / 360)}`}
            transform={`rotate(-90 ${center.x} ${center.y})`}
            className="transition-all duration-100"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Tick marks */}
          {ticks.map((tick, i) => (
            <line
              key={i}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ))}

          {/* Center dot */}
          <circle
            cx={center.x}
            cy={center.y}
            r="4"
            fill="#6366f1"
          />

          {/* Line from center to knob */}
          <line
            x1={center.x}
            y1={center.y}
            x2={knobX}
            y2={knobY}
            stroke="#6366f1"
            strokeWidth="2"
          />

          {/* Knob */}
          <circle
            cx={knobX}
            cy={knobY}
            r="16"
            fill="white"
            stroke="#6366f1"
            strokeWidth="3"
            className={cn(
              "transition-all",
              isDragging ? "scale-110" : "scale-100"
            )}
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              transformOrigin: `${knobX}px ${knobY}px`
            }}
          />
          <circle
            cx={knobX}
            cy={knobY}
            r="6"
            fill="#6366f1"
          />
        </svg>

        {/* Hour labels */}
        <div className="absolute inset-0 pointer-events-none">
          {[0, 1, 2, 3].map((hour) => {
            const hourMinutes = hour * 60;
            if (hourMinutes > maxMinutes) return null;

            const angle = getAngleFromMinutes(hourMinutes);
            const labelRadius = radius + 25;
            const x = center.x + labelRadius * Math.sin(angle * Math.PI / 180);
            const y = center.y - labelRadius * Math.cos(angle * Math.PI / 180);

            return (
              <div
                key={hour}
                className="absolute text-xs font-semibold text-gray-600"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {hour}h
              </div>
            );
          })}
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground text-center">
        Drag the knob around the circle to set time
      </p>
    </div>
  );
}
