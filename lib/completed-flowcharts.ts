// Completed Flowcharts Storage System
import { FlowchartData, FlowchartStep } from "./flowchart-data";
import { storage } from './storage';

export interface BugReport {
  id: string;
  taskId: string; // Which task this bug was found in
  stepId: string; // Which step this bug belongs to
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "crushed"; // "crushed" = resolved/fixed
  reportedAt: string;
  reportedBy?: string; // Technician who reported it
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

export interface CompletedFlowchart {
  id: string; // Unique ID for this completed report
  flowchartId: string; // Original flowchart ID (e.g., "enventus-mk0-1y")
  wtgNumber: string; // Wind Turbine Generator number (5-digit unique identifier)
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
  bugs?: BugReport[]; // Bug reports found during this service
  summary: {
    totalSteps: number;
    completedSteps: number;
    totalTasks: number;
    completedTasks: number;
    totalNotes: number;
    totalBugs: number;
    openBugs: number;
    crushedBugs: number;
    targetTimeMinutes: number;
    actualTimeMinutes: number;
    timeVariance: number; // Positive = overtime, Negative = ahead of schedule
  };
}

const STORAGE_KEY = 'completed-flowcharts';

// Get all completed flowcharts from storage
export async function getCompletedFlowcharts(): Promise<CompletedFlowchart[]> {
  // Check if we're on the client side
  if (typeof window === 'undefined') return [];

  try {
    const stored = await storage.get<CompletedFlowchart[]>(STORAGE_KEY);
    return stored || [];
  } catch (e) {
    console.error('Failed to load completed flowcharts:', e);
    return [];
  }
}

// Save a completed flowchart
export async function saveCompletedFlowchart(
  flowchartData: FlowchartData,
  steps: FlowchartStep[],
  startedAt: string,
  wtgNumber: string,
  bugs?: BugReport[],
  t1?: { id: string; name: string; initials: string },
  t2?: { id: string; name: string; initials: string }
): Promise<CompletedFlowchart> {
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

  const totalBugs = bugs?.length || 0;
  const openBugs = bugs?.filter(b => b.status === "open").length || 0;
  const crushedBugs = bugs?.filter(b => b.status === "crushed").length || 0;

  const completedFlowchart: CompletedFlowchart = {
    id: `${flowchartData.id}-${Date.now()}`, // Unique ID with timestamp
    flowchartId: flowchartData.id,
    wtgNumber,
    flowchartData,
    steps,
    startedAt,
    completedAt: new Date().toISOString(),
    totalDurationMinutes: actualTimeMinutes,
    technicians: {
      ...(t1 && { t1 }),
      ...(t2 && { t2 })
    },
    bugs,
    summary: {
      totalSteps: steps.length,
      completedSteps,
      totalTasks,
      completedTasks,
      totalNotes,
      totalBugs,
      openBugs,
      crushedBugs,
      targetTimeMinutes: flowchartData.totalMinutes,
      actualTimeMinutes,
      timeVariance: actualTimeMinutes - flowchartData.totalMinutes
    }
  };

  // Save to storage
  if (typeof window !== 'undefined') {
    const existing = await getCompletedFlowcharts();
    existing.push(completedFlowchart);
    await storage.set(STORAGE_KEY, existing);
  }

  return completedFlowchart;
}

// Get completed flowcharts for a specific flowchart ID
export async function getCompletedFlowchartsById(flowchartId: string): Promise<CompletedFlowchart[]> {
  const all = await getCompletedFlowcharts();
  return all.filter(cf => cf.flowchartId === flowchartId);
}

// Delete a completed flowchart
export async function deleteCompletedFlowchart(id: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const existing = await getCompletedFlowcharts();
  const filtered = existing.filter(cf => cf.id !== id);
  await storage.set(STORAGE_KEY, filtered);
}

// Get completed flowcharts sorted by completion date (newest first)
export async function getCompletedFlowchartsSorted(): Promise<CompletedFlowchart[]> {
  const all = await getCompletedFlowcharts();
  return all.sort((a, b) =>
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

// Get all bugs from all completed flowcharts
export async function getAllBugs(): Promise<Array<BugReport & { flowchartId: string; wtgNumber: string; flowchartName: string }>> {
  const allFlowcharts = await getCompletedFlowcharts();
  const bugs: Array<BugReport & { flowchartId: string; wtgNumber: string; flowchartName: string }> = [];

  allFlowcharts.forEach(flowchart => {
    if (flowchart.bugs && flowchart.bugs.length > 0) {
      flowchart.bugs.forEach(bug => {
        bugs.push({
          ...bug,
          flowchartId: flowchart.flowchartId,
          wtgNumber: flowchart.wtgNumber,
          flowchartName: `${flowchart.flowchartData.model} - ${flowchart.flowchartData.serviceType}`
        });
      });
    }
  });

  return bugs;
}

// Get bugs by status
export async function getBugsByStatus(status: "open" | "investigating" | "crushed"): Promise<Array<BugReport & { flowchartId: string; wtgNumber: string; flowchartName: string }>> {
  const allBugs = await getAllBugs();
  return allBugs.filter(bug => bug.status === status);
}

// Get bugs for a specific WTG number
export async function getBugsByWTG(wtgNumber: string): Promise<BugReport[]> {
  const allFlowcharts = await getCompletedFlowcharts();
  const flowchart = allFlowcharts.find(cf => cf.wtgNumber === wtgNumber);
  return flowchart?.bugs || [];
}

// Update bug status
export async function updateBugStatus(bugId: string, status: "open" | "investigating" | "crushed", resolvedBy?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const allFlowcharts = await getCompletedFlowcharts();

  for (const flowchart of allFlowcharts) {
    if (flowchart.bugs) {
      const bugIndex = flowchart.bugs.findIndex(b => b.id === bugId);
      if (bugIndex !== -1) {
        flowchart.bugs[bugIndex].status = status;
        if (status === "crushed") {
          flowchart.bugs[bugIndex].resolvedAt = new Date().toISOString();
          flowchart.bugs[bugIndex].resolvedBy = resolvedBy;
        }

        // Update summary counts
        flowchart.summary.openBugs = flowchart.bugs.filter(b => b.status === "open").length;
        flowchart.summary.crushedBugs = flowchart.bugs.filter(b => b.status === "crushed").length;

        await storage.set(STORAGE_KEY, allFlowcharts);
        break;
      }
    }
  }
}
