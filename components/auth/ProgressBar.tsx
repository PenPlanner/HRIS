"use client"

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  duration?: number; // Duration in milliseconds
  onComplete?: () => void;
  className?: string;
}

export default function ProgressBar({
  duration = 3000,
  onComplete,
  className,
}: ProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);

      setProgress(newProgress);
      setDisplayProgress(Math.floor(newProgress));

      if (newProgress >= 100) {
        clearInterval(interval);
        if (onComplete) {
          setTimeout(onComplete, 200);
        }
      }
    }, 30); // Update every 30ms for smooth animation

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  // Calculate color based on progress
  const getProgressColor = () => {
    if (progress < 33) {
      // Red to orange
      return "from-red-500 to-orange-500";
    } else if (progress < 66) {
      // Orange to yellow
      return "from-orange-500 to-yellow-500";
    } else {
      // Yellow to green
      return "from-yellow-500 to-green-500";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Progress Text */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-white/70">Loading</span>
        <span className="text-sm font-bold text-white tabular-nums">
          {displayProgress}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255, 255, 255, 0.1) 10px,
              rgba(255, 255, 255, 0.1) 20px
            )`,
          }}
        />

        {/* Progress Fill */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-300",
            getProgressColor()
          )}
          style={{
            width: `${progress}%`,
            boxShadow: `0 0 20px rgba(34, 197, 94, ${progress / 100 * 0.5})`,
          }}
        >
          {/* Animated Shine Effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(
                90deg,
                transparent 0%,
                rgba(255, 255, 255, 0.5) 50%,
                transparent 100%
              )`,
              animation: "shine 1.5s infinite",
            }}
          />

          {/* Leading Edge Glow */}
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-sm animate-pulse" />
        </div>

        {/* Progress Particles */}
        {progress > 5 && progress < 95 && (
          <>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute h-full w-1 bg-white/30 animate-slide"
                style={{
                  left: `${progress - 5 - i * 3}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Status Messages */}
      <div className="text-center">
        <p className="text-xs text-white/50 transition-opacity duration-300">
          {progress < 25 && "Connecting to server..."}
          {progress >= 25 && progress < 50 && "Loading flowchart data..."}
          {progress >= 50 && progress < 75 && "Initializing components..."}
          {progress >= 75 && progress < 100 && "Almost ready..."}
          {progress >= 100 && "Complete!"}
        </p>
      </div>

      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        @keyframes slide {
          0% {
            opacity: 0;
            transform: translateX(0);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(10px);
          }
        }

        .animate-slide {
          animation: slide 1s ease-out infinite;
        }
      `}</style>
    </div>
  );
}