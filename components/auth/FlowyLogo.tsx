"use client"

import { cn } from "@/lib/utils";

interface FlowyLogoProps {
  className?: string;
}

export default function FlowyLogo({ className }: FlowyLogoProps) {
  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 0 200 60"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Simple gradient for the logo */}
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Clean text-based logo with subtle flowchart elements */}
        <g className="opacity-90">
          {/* "Flowy" text */}
          <text
            x="100"
            y="35"
            textAnchor="middle"
            className="fill-white text-4xl font-bold"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            Flowy
          </text>

          {/* Subtle flowchart nodes as dots */}
          <circle cx="30" cy="30" r="3" fill="url(#logo-gradient)" opacity="0.8" />
          <circle cx="170" cy="30" r="3" fill="url(#logo-gradient)" opacity="0.8" />

          {/* Connection lines */}
          <line
            x1="33"
            y1="30"
            x2="60"
            y2="30"
            stroke="url(#logo-gradient)"
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="140"
            y1="30"
            x2="167"
            y2="30"
            stroke="url(#logo-gradient)"
            strokeWidth="1"
            opacity="0.4"
          />
        </g>
      </svg>
    </div>
  );
}