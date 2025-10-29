"use client"

import { useState } from "react";
import { X, TestTube, Database } from "lucide-react";

export function ExperimentalBadge() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg shadow-lg border border-orange-400/30 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <TestTube className="h-4 w-4" />
          <div className="text-sm font-medium">
            <span className="block">TECH DEMO - EARLY ALPHA</span>
            <span className="text-xs opacity-90">Frontend Only • Local Storage</span>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
            aria-label="Dismiss badge"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <div className="mt-2 text-xs opacity-80 flex items-center gap-1">
          <Database className="h-3 w-3" />
          <span>This is a technology demonstration.</span>
        </div>
      </div>
    </div>
  );
}

