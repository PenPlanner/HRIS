// Completed Flowcharts Storage System
import { FlowchartData, FlowchartStep } from "./flowchart-data";

export interface CompletedFlowchart {
  id: string; // Unique ID for this completed report
  flowchartId: string; // Original flowchart ID (e.g., "enventus-mk0-1y")
  flowchartData: FlowchartData; // Original flowchart metadata
  steps: FlowchartStep[]; // All steps with completed tasks, times, notes, etc.
  startedAt: string; // ISO timestamp when work started
  completedAt: string; // ISO timestamp when all tasks were completed
  totalDurationMinutes: number; // Total actual time spent
  technicians: {
    t1?: {
      id: string;
      name: string;
      initials: string;
    };
    t2?: {
      id: string;
      name: string;
      initials: string;
    };
  };
  summary: {
    totalSteps: number;
    completedSteps: number;
    totalTasks: number;
    completedTasks: number;
    totalNotes: number;
    targetTimeMinutes: number;
    actualTimeMinutes: number;
    timeVariance: number; // Positive = overtime, Negative = ahead of schedule
  };
}

const STORAGE_KEY = 'completed-flowcharts';

// Get all completed flowcharts from localStorage
export function getCompletedFlowcharts(): CompletedFlowchart[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load completed flowcharts:', e);
    return [];
  }
}

// Save a completed flowchart
export function saveCompletedFlowchart(
  flowchartData: FlowchartData,
  steps: FlowchartStep[],
  startedAt: string,
  t1?: { id: string; name: string; initials: string },
  t2?: { id: string; name: string; initials: string }
): CompletedFlowchart {
  // Calculate summary statistics
  const completedSteps = steps.filter(step => step.completedAt).length;
  const totalTasks = steps.reduce((sum, step) => sum + step.tasks.length, 0);
  const completedTasks = steps.reduce((sum, step) =>
    sum + step.tasks.filter(task => task.completed).length, 0
  );
  const totalNotes = steps.reduce((sum, step) => {
    return sum + step.tasks.reduce((taskSum, task) =>
      taskSum + (task.notes?.length || 0), 0
    );
  }, 0);

  const actualTimeMinutes = steps.reduce((sum, step) =>
    sum + step.tasks.reduce((taskSum, task) =>
      taskSum + (task.actualTimeMinutes || 0), 0
    ), 0
  );

  const completedFlowchart: CompletedFlowchart = {
    id: `${flowchartData.id}-${Date.now()}`, // Unique ID with timestamp
    flowchartId: flowchartData.id,
    flowchartData,
    steps,
    startedAt,
    completedAt: new Date().toISOString(),
    totalDurationMinutes: actualTimeMinutes,
    technicians: {
      ...(t1 && { t1 }),
      ...(t2 && { t2 })
    },
    summary: {
      totalSteps: steps.length,
      completedSteps,
      totalTasks,
      completedTasks,
      totalNotes,
      targetTimeMinutes: flowchartData.totalMinutes,
      actualTimeMinutes,
      timeVariance: actualTimeMinutes - flowchartData.totalMinutes
    }
  };

  // Save to localStorage
  const existing = getCompletedFlowcharts();
  existing.push(completedFlowchart);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

  return completedFlowchart;
}

// Get completed flowcharts for a specific flowchart ID
export function getCompletedFlowchartsById(flowchartId: string): CompletedFlowchart[] {
  return getCompletedFlowcharts().filter(cf => cf.flowchartId === flowchartId);
}

// Delete a completed flowchart
export function deleteCompletedFlowchart(id: string): void {
  const existing = getCompletedFlowcharts();
  const filtered = existing.filter(cf => cf.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

// Get completed flowcharts sorted by completion date (newest first)
export function getCompletedFlowchartsSorted(): CompletedFlowchart[] {
  return getCompletedFlowcharts().sort((a, b) =>
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}

// Check if flowchart is fully completed (all tasks done)
export function isFlowchartFullyCompleted(steps: FlowchartStep[]): boolean {
  if (steps.length === 0) return false;

  const totalTasks = steps.reduce((sum, step) => sum + step.tasks.length, 0);
  const completedTasks = steps.reduce((sum, step) =>
    sum + step.tasks.filter(task => task.completed).length, 0
  );

  return totalTasks > 0 && completedTasks === totalTasks;
}

// Get earliest start time from steps
export function getEarliestStartTime(steps: FlowchartStep[]): string | null {
  const startTimes = steps
    .map(step => step.startedAt)
    .filter((time): time is string => !!time)
    .sort();

  return startTimes.length > 0 ? startTimes[0] : null;
}

// Format duration for display
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
