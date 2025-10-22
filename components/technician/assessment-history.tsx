"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { useEffect, useState } from "react";

type VestasLevel = 'D' | 'C' | 'B' | 'A' | 'Field Trainer';

interface AssessmentHistory {
  id: string;
  technician_id: string;
  timestamp: string;
  previous_level: number;
  new_level: number;
  previous_points: number;
  new_points: number;
  previous_vestas_level: VestasLevel;
  new_vestas_level: VestasLevel;
  changes: string[];
}

// Vestas Level Colors
const getVestasLevelColor = (level: VestasLevel): { bg: string; text: string; border: string } => {
  switch (level) {
    case 'D':
      return { bg: '#9ca3af', text: '#ffffff', border: '#6b7280' }; // Gray
    case 'C':
      return { bg: '#3b82f6', text: '#ffffff', border: '#2563eb' }; // Blue
    case 'B':
      return { bg: '#10b981', text: '#ffffff', border: '#059669' }; // Green
    case 'A':
      return { bg: '#8b5cf6', text: '#ffffff', border: '#7c3aed' }; // Purple
    case 'Field Trainer':
      return { bg: '#f59e0b', text: '#ffffff', border: '#d97706' }; // Amber/Gold
    default:
      return { bg: '#9ca3af', text: '#ffffff', border: '#6b7280' };
  }
};

interface AssessmentHistoryProps {
  technicianId: string;
  limit?: number;
}

export function AssessmentHistory({ technicianId, limit }: AssessmentHistoryProps) {
  const [history, setHistory] = useState<AssessmentHistory[]>([]);

  useEffect(() => {
    const loadHistory = () => {
      const saved = localStorage.getItem(`assessment_history_${technicianId}`);
      if (saved) {
        const allHistory = JSON.parse(saved);
        setHistory(limit ? allHistory.slice(0, limit) : allHistory);
      }
    };

    loadHistory();

    // Listen for storage changes (in case history is updated in another tab/component)
    const handleStorageChange = () => {
      loadHistory();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [technicianId, limit]);

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No assessment changes recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTrendIcon = (oldLevel: number, newLevel: number) => {
    if (newLevel > oldLevel) {
      return <TrendingUp className="h-5 w-5 text-green-500" />;
    } else if (newLevel < oldLevel) {
      return <TrendingDown className="h-5 w-5 text-red-500" />;
    }
    return <Minus className="h-5 w-5 text-gray-400" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {history.map((entry, index) => {
          const previousColor = getVestasLevelColor(entry.previous_vestas_level);
          const newColor = getVestasLevelColor(entry.new_vestas_level);
          const levelIncreased = entry.new_level > entry.previous_level;
          const levelDecreased = entry.new_level < entry.previous_level;

          return (
            <div
              key={entry.id}
              className={`p-4 rounded-lg border ${
                index === 0 ? 'border-primary border-2 bg-primary/5' : 'border-border'
              }`}
            >
              {/* Timestamp */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Clock className="h-3 w-3" />
                {formatDate(entry.timestamp)}
                {index === 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">Latest</Badge>
                )}
              </div>

              {/* Competency Level Change */}
              <div className="flex items-center gap-3 mb-3">
                {getTrendIcon(entry.previous_level, entry.new_level)}
                <div className="flex items-center gap-2">
                  <Badge
                    variant={levelDecreased ? "destructive" : "secondary"}
                    className="text-base px-3 py-1"
                  >
                    Level {entry.previous_level}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge
                    variant={levelIncreased ? "default" : levelDecreased ? "destructive" : "secondary"}
                    className="text-base px-3 py-1"
                  >
                    Level {entry.new_level}
                  </Badge>
                </div>
                <div className="ml-auto text-sm">
                  <span className={`font-medium ${
                    entry.new_points > entry.previous_points ? 'text-green-600' :
                    entry.new_points < entry.previous_points ? 'text-red-600' :
                    'text-muted-foreground'
                  }`}>
                    {entry.previous_points} → {entry.new_points} points
                  </span>
                </div>
              </div>

              {/* Vestas Level Change (if changed) */}
              {entry.previous_vestas_level !== entry.new_vestas_level && (
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    style={{
                      backgroundColor: previousColor.bg,
                      color: previousColor.text,
                      borderColor: previousColor.border
                    }}
                  >
                    {entry.previous_vestas_level}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge
                    style={{
                      backgroundColor: newColor.bg,
                      color: newColor.text,
                      borderColor: newColor.border
                    }}
                  >
                    {entry.new_vestas_level}
                  </Badge>
                </div>
              )}

              {/* Changes List */}
              {entry.changes.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Changes:</p>
                  <ul className="space-y-1">
                    {entry.changes.map((change, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
