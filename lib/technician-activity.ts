/**
 * Technician Activity Logging System
 *
 * This module handles logging of technician activities across turbines, services, and steps.
 * It tracks check-in/check-out times and creates a comprehensive work history.
 */

export interface TechnicianActivity {
  id: string;
  technicianId: string;
  technicianInitials: string;
  technicianName: string;
  technicianRole: 'T1' | 'T2' | 'T3'; // T3 = Trainee
  turbineModel: string;
  serviceType: string;
  stepId: string;
  stepTitle: string;
  taskId?: string;
  taskDescription?: string;
  checkInTime: string; // ISO timestamp
  checkOutTime?: string; // ISO timestamp
  durationMinutes?: number;
  notes?: string;
  timestamp: string; // ISO timestamp when log was created
}

export interface TechnicianWorkHistory {
  technicianId: string;
  technicianInitials: string;
  technicianName: string;
  activities: TechnicianActivity[];
  totalMinutesWorked: number;
  turbinesWorkedOn: string[];
  servicesCompleted: string[];
  stepsCompleted: number;
}

const STORAGE_KEY = 'technician_activities';

/**
 * Generate a unique ID for an activity
 */
export function generateActivityId(): string {
  return `activity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Save a new technician activity
 */
export function logTechnicianActivity(activity: Omit<TechnicianActivity, 'id' | 'timestamp'>): TechnicianActivity {
  const newActivity: TechnicianActivity = {
    ...activity,
    id: generateActivityId(),
    timestamp: new Date().toISOString(),
  };

  const activities = getAllActivities();
  activities.push(newActivity);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));

  return newActivity;
}

/**
 * Update an existing activity (e.g., add check-out time)
 */
export function updateTechnicianActivity(activityId: string, updates: Partial<TechnicianActivity>): void {
  const activities = getAllActivities();
  const index = activities.findIndex(a => a.id === activityId);

  if (index !== -1) {
    activities[index] = { ...activities[index], ...updates };

    // Calculate duration if check-out time is provided
    if (updates.checkOutTime && activities[index].checkInTime) {
      const checkIn = new Date(activities[index].checkInTime);
      const checkOut = new Date(updates.checkOutTime);
      activities[index].durationMinutes = Math.round((checkOut.getTime() - checkIn.getTime()) / 60000);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }
}

/**
 * Get all activities from storage
 */
export function getAllActivities(): TechnicianActivity[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse technician activities:', error);
    return [];
  }
}

/**
 * Get activities for a specific technician
 */
export function getTechnicianActivities(technicianId: string): TechnicianActivity[] {
  return getAllActivities().filter(a => a.technicianId === technicianId);
}

/**
 * Get work history for a specific technician
 */
export function getTechnicianWorkHistory(technicianId: string): TechnicianWorkHistory | null {
  const activities = getTechnicianActivities(technicianId);

  if (activities.length === 0) return null;

  const firstActivity = activities[0];
  const totalMinutesWorked = activities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
  const turbinesWorkedOn = [...new Set(activities.map(a => a.turbineModel))];
  const servicesCompleted = [...new Set(activities.map(a => a.serviceType))];
  const stepsCompleted = [...new Set(activities.map(a => a.stepId))].length;

  return {
    technicianId,
    technicianInitials: firstActivity.technicianInitials,
    technicianName: firstActivity.technicianName,
    activities,
    totalMinutesWorked,
    turbinesWorkedOn,
    servicesCompleted,
    stepsCompleted,
  };
}

/**
 * Get activities for a specific step
 */
export function getStepActivities(stepId: string): TechnicianActivity[] {
  return getAllActivities().filter(a => a.stepId === stepId);
}

/**
 * Get activities for a specific turbine/service combination
 */
export function getServiceActivities(turbineModel: string, serviceType: string): TechnicianActivity[] {
  return getAllActivities().filter(
    a => a.turbineModel === turbineModel && a.serviceType === serviceType
  );
}

/**
 * Clear all activities (for testing/reset purposes)
 */
export function clearAllActivities(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export activities as JSON for backup
 */
export function exportActivitiesAsJSON(): string {
  return JSON.stringify(getAllActivities(), null, 2);
}

/**
 * Import activities from JSON backup
 */
export function importActivitiesFromJSON(json: string): void {
  try {
    const activities = JSON.parse(json);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  } catch (error) {
    console.error('Failed to import activities:', error);
    throw new Error('Invalid JSON format');
  }
}
