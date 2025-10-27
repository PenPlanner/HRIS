import { getServiceTypeColor } from "./service-colors";

export interface TaskNoteEdit {
  timestamp: string;
  version: number;
}

export interface TaskNote {
  id: string;
  timestamp: string;
  note: string;
  edits?: TaskNoteEdit[];
}

export interface FlowchartTask {
  id: string;
  description: string;
  completed?: boolean;
  startTime?: string;
  endTime?: string;
  completedAt?: string;
  // Manual time entry in minutes
  actualTimeMinutes?: number;
  // Notes for deviations, improvements, etc. - array of timestamped notes
  notes?: TaskNote[];
  // Service type this task belongs to (e.g., "1Y", "2Y", "4Y")
  // Extracted from PDF text color or manually assigned
  serviceType?: string;
  // RGB color from PDF (for debugging/verification)
  pdfRgb?: { r: number; g: number; b: number };
  // Whether this task should be indented as a sub-task
  isIndented?: boolean;
}

export interface ServiceTimesBreakdown {
  [serviceType: string]: number; // e.g., "1Y": 120, "2Y": 240
}

export interface StepDisplaySettings {
  fontSize?: number; // Font size in px (default: 11)
  taskSpacing?: number; // Gap between tasks in rem (default: 0.5)
  referenceColumnWidth?: number; // Reference number column width in px (default: 80, 0 = auto)
}

export interface FlowchartStep {
  id: string;
  title: string;
  duration: string;
  durationMinutes: number;
  serviceTimes?: ServiceTimesBreakdown; // Parsed service-specific times in minutes
  color: string;
  colorCode: string; // e.g., "2Y", "3Y", "5Y", etc.
  technician: "T1" | "T2" | "both";
  position: { x: number; y: number };
  tasks: FlowchartTask[];
  documents?: string[];
  media?: string[];
  notes?: string;
  completedAt?: string; // Timestamp when step was completed
  completedBy?: string; // Technician ID who completed this step
  completedByInitials?: string; // Technician initials for quick display
  startedAt?: string; // Timestamp when step was started
  elapsedTime?: number; // Total elapsed time in seconds for this step
  assignedTechnicianId?: string; // ID of technician assigned to this specific step
  assignedTechnicianInitials?: string; // Initials of assigned technician for display
  displaySettings?: StepDisplaySettings; // Custom display settings for this step
}

/**
 * Parse duration string to extract service-specific times
 * Example: "2h + (2Y)2h + (4Y)5m" => { "1Y": 120, "2Y": 120, "4Y": 5 }
 */
export function parseServiceTimes(durationString: string): ServiceTimesBreakdown {
  const serviceTimes: ServiceTimesBreakdown = {};

  // Match patterns like "2h", "(2Y)2h", "(4Y)5m", "(5Y)3h 15m"
  const baseTimeMatch = durationString.match(/^(\d+)([hm])/);
  if (baseTimeMatch) {
    const value = parseInt(baseTimeMatch[1]);
    const unit = baseTimeMatch[2];
    serviceTimes["1Y"] = unit === 'h' ? value * 60 : value;
  }

  // Match service-specific times: (2Y)2h, (4Y)5m, (5Y)3h 15m
  const servicePattern = /\((\d+Y)\)(\d+)([hm])(?: (\d+)m)?/g;
  let match;
  while ((match = servicePattern.exec(durationString)) !== null) {
    const serviceType = match[1];
    const value = parseInt(match[2]);
    const unit = match[3];
    const extraMinutes = match[4] ? parseInt(match[4]) : 0;

    const minutes = (unit === 'h' ? value * 60 : value) + extraMinutes;
    serviceTimes[serviceType] = minutes;
  }

  return serviceTimes;
}

/**
 * Calculate cumulative time for a selected service type
 * When selecting 2Y, you get 1Y + 2Y time
 * When selecting 4Y, you get 1Y + 2Y + 4Y time, etc.
 */
export function getCumulativeServiceTime(
  serviceTimes: ServiceTimesBreakdown | undefined,
  selectedServiceType: string
): number {
  if (!serviceTimes) return 0;

  // Service type ordering for cumulative calculation
  const serviceOrder = ["1Y", "2Y", "3Y", "4Y", "5Y", "6Y", "7Y", "10Y", "12Y"];
  const selectedIndex = serviceOrder.indexOf(selectedServiceType);

  if (selectedIndex === -1) return serviceTimes["1Y"] || 0;

  // Sum all times up to and including the selected service type
  let totalMinutes = 0;
  for (let i = 0; i <= selectedIndex; i++) {
    const serviceType = serviceOrder[i];
    if (serviceTimes[serviceType]) {
      totalMinutes += serviceTimes[serviceType];
    }
  }

  return totalMinutes;
}

export interface FlowchartData {
  id: string;
  model: string;
  serviceType: string;
  optimizedSIF: string;
  referenceDocument: string;
  revisionDate: string;
  technicians: number;
  totalTime: string;
  totalMinutes: number;
  workHours: string;
  duration: string;
  steps: FlowchartStep[];
  edges?: any[]; // React Flow edges (connections between steps)
  gridSize?: number; // Grid size for layout (default: 30)
  layoutMode?: 'topdown' | 'centered'; // Layout mode (default: 'centered')
  isCustom?: boolean; // True for user-created flowcharts
  createdAt?: string;
  updatedAt?: string;
  // Selected service interval for filtering tasks (e.g., "1Y", "2Y", "4Y", "6Y")
  selectedServiceType?: string;
}

// EnVentus Mk 0 - 1Y Service Flowchart
// Steps reorganized to match PDF flowchart sequence (Flowchart 2.pdf)
// Parallel steps: 2, 5, 6, 8, 9
// Sequential steps: 1, 3, 4, 7, 10
// Standalone: 4Y bolts 17h
//
// IMPORTANT: These positions are the STANDARD/DEFAULT layout.
// Any custom saved layouts are automatically cleared when this flowchart loads.
// This ensures consistency across all users and sessions.
export const ENVENTUS_MK0_1Y: FlowchartData = {
  id: "enventus-mk0-1y",
  model: "EnVentus Mk 0",
  serviceType: "1Y Service",
  optimizedSIF: "0159-0667",
  referenceDocument: "0093-1909 V09",
  revisionDate: "04/2025",
  technicians: 2,
  totalTime: "2280m",
  totalMinutes: 2280,
  workHours: "38:00h",
  duration: "19:00h",
  gridSize: 30,
  layoutMode: 'centered',
  steps: [
    // Step 1: PPE equipment on (Both technicians) - 2 tasks
    {
      id: "step-1",
      title: "PPE equipment on\nPrepare for Service",
      duration: "1h",
      durationMinutes: 60,
      color: getServiceTypeColor("Multi"),
      colorCode: "Multi",
      technician: "both",
      position: { x: 1, y: 2 },
      tasks: [
        { id: "1-task-1", description: "PPE equipment on", serviceType: "1Y" },
        { id: "1-task-2", description: "Prepare for Service", serviceType: "1Y" }
      ]
    },

    // Step 2.1: Lift check (T1) - PARALLEL with 2.2 - 8 tasks
    {
      id: "step-2-1",
      title: "13.5.1.Lift check\nLift up\nVisual insp. Nacelle\nCrane down\n11.5.1. Examine crane\nCrane up\n2.7.2.3 Warning sounder & lamp Nacelle\n10.5.2.1 Yaw unusual noise",
      duration: "2h 30m",
      durationMinutes: 150,
      color: getServiceTypeColor("Multi"),
      colorCode: "Multi",
      technician: "T1",
      position: { x: 17, y: -9 },
      tasks: [
        { id: "2-1-1", description: "13.5.1.Lift check", serviceType: "1Y" },
        { id: "2-1-2", description: "Lift up", serviceType: "1Y" },
        { id: "2-1-3", description: "Visual insp. Nacelle", serviceType: "1Y" },
        { id: "2-1-4", description: "Crane down", serviceType: "1Y" },
        { id: "2-1-5", description: "11.5.1. Examine crane", serviceType: "1Y" },
        { id: "2-1-6", description: "Crane up", serviceType: "1Y" },
        { id: "2-1-7", description: "2.7.2.3 Warning sounder & lamp Nacelle", serviceType: "1Y" },
        { id: "2-1-8", description: "10.5.2.1 Yaw unusual noise", serviceType: "1Y" }
      ]
    },

    // Step 2.2: Prep bags and tools (T2) - PARALLEL with 2.1 - 7 tasks
    {
      id: "step-2-2",
      title: "Prep bags and tools\n14.5.11 Earthing system\n14.5.9 Dehumidifier\n14.5.8 Door filter\n14.5.10 Tower surface\n14.5.12 Ground control panel ++01\n2.7.1.2 Warning sounder & lamp Tower",
      duration: "2h 30m",
      durationMinutes: 150,
      color: getServiceTypeColor("Multi"),
      colorCode: "Multi",
      technician: "T2",
      position: { x: 17, y: 9 },
      tasks: [
        { id: "2-2-1", description: "Prep bags and tools", serviceType: "1Y" },
        { id: "2-2-2", description: "14.5.11 Earthing system", serviceType: "1Y" },
        { id: "2-2-3", description: "14.5.9 Dehumidifier", serviceType: "1Y" },
        { id: "2-2-4", description: "14.5.8 Door filter", serviceType: "1Y" },
        { id: "2-2-5", description: "14.5.10 Tower surface", serviceType: "1Y" },
        { id: "2-2-6", description: "14.5.12 Ground control panel ++01", serviceType: "1Y" },
        { id: "2-2-7", description: "2.7.1.2 Warning sounder & lamp Tower", serviceType: "1Y" }
      ]
    },

    // Step 3: Prep in turbine (Both technicians) - 8 tasks
    {
      id: "step-3",
      title: "Prep in turbine\n2.7.2 Safety test Nacelle\n3.5.1-5.3 ResQ equip., extinguishers & first-aid kits\n3.5.5 Anchor points (Nacelle)\nSpinner outside\n6.5.6 Rotor lock system\n6.5.4.8-5.4.9 Expansion disc main shaft\n6.5.5 Bulkheads main shaft",
      duration: "1h 30m",
      durationMinutes: 90,
      color: getServiceTypeColor("Multi"),
      colorCode: "Multi",
      technician: "both",
      position: { x: 33, y: 0 },
      tasks: [
        { id: "3-1", description: "Prep in turbine", serviceType: "1Y" },
        { id: "3-2", description: "2.7.2 Safety test Nacelle", serviceType: "1Y" },
        { id: "3-3", description: "3.5.1-5.3 ResQ equip., extinguishers & first-aid kits", serviceType: "1Y" },
        { id: "3-4", description: "3.5.5 Anchor points (Nacelle)", serviceType: "1Y" },
        { id: "3-5", description: "Spinner outside", serviceType: "1Y" },
        { id: "3-6", description: "6.5.6 Rotor lock system", serviceType: "1Y" },
        { id: "3-7", description: "6.5.4.8-5.4.9 Expansion disc main shaft", serviceType: "1Y" },
        { id: "3-8", description: "6.5.5 Bulkheads main shaft", serviceType: "1Y" }
      ]
    },

    // Step 4: Generator (T1) - 13 tasks
    {
      id: "step-4",
      title: "7. Generator\n6.5.2.11 Visual inspection for leakages in hoses\n6.5.2.2 Replace 50 um filter\n6.5.2.3 Replace inline filter\n6.5.2.4 Replace offline filter\n6.6.2.6 Replace the Value actuators\n6.6.2.7 Replace the oil pumpmotor and clutch\n6.5.2.8 Replace the VFD\n6.5.2.9 Validate pressure transmitters\n6.5.2.12 Visual inspec. leakages in lubrication hoses\n6.5.3 Visual inspection and replace filter mat AVC system\n9.5.3.1 Inspect brushes for wear\n6.5.2.13 Repair and replace oil debris monitor system",
      duration: "2h + (2Y)2h + (4Y)5m + (5Y)3h 15m + (6Y)6h + (10Y)3h",
      durationMinutes: 120,
      color: getServiceTypeColor("Multi"),
      colorCode: "Multi",
      technician: "both",
      position: { x: 49, y: -4 },
      documents: ["7"],
      tasks: [
        { id: "4-1", description: "7. Generator", serviceType: "1Y" },
        { id: "4-2", description: "6.5.2.11 Visual inspection for leakages in hoses", serviceType: "1Y" },
        { id: "4-3", description: "6.5.2.2 Replace 50 um filter", serviceType: "2Y" },
        { id: "4-4", description: "6.5.2.3 Replace inline filter", serviceType: "2Y" },
        { id: "4-5", description: "6.5.2.4 Replace offline filter", serviceType: "2Y" },
        { id: "4-6", description: "6.6.2.6 Replace the Value actuators", serviceType: "5Y" },
        { id: "4-7", description: "6.6.2.7 Replace the oil pumpmotor and clutch", serviceType: "5Y" },
        { id: "4-8", description: "6.5.2.8 Replace the VFD", serviceType: "4Y" },
        { id: "4-9", description: "6.5.2.9 Validate pressure transmitters", serviceType: "5Y" },
        { id: "4-10", description: "6.5.2.12 Visual inspec. leakages in lubrication hoses", serviceType: "5Y" },
        { id: "4-11", description: "6.5.3 Visual inspection and replace filter mat AVC system", serviceType: "6Y" },
        { id: "4-12", description: "9.5.3.1 Inspect brushes for wear", serviceType: "10Y" },
        { id: "4-13", description: "6.5.2.13 Repair and replace oil debris monitor system", serviceType: "5Y" }
      ]
    },

    // Step 5.1: CubePower and Yaw system (T1) - PARALLEL with 5.2 - 10 tasks
    {
      id: "step-5-1",
      title: "8.5.2 Replace CubePower air filters\n10.5.1 Yaw control panel ++68\n10.5.2.1-5.2.4 Yaw system\n10.5.2.5 Spring packs\n10.5.2.6-5.2.7 Lubrication pumps\n6.5.1.1 Battery Inspection\n4. 5.2.7.12 M6 bolts rotation transfer\n6.5.1.2 Replace backup batteries\n6.5.1.3 Check heater\n10.5.2.1.1 Clean yaw grease",
      duration: "3h + (2Y)1h 45m + (4y)45m + (+)4h",
      durationMinutes: 180,
      color: getServiceTypeColor("Multi"),
      colorCode: "Multi",
      technician: "T1",
      position: { x: 65, y: -11 },
      tasks: [
        { id: "5-1-1", description: "8.5.2 Replace CubePower air filters", serviceType: "2Y" },
        { id: "5-1-2", description: "10.5.1 Yaw control panel ++68", serviceType: "1Y" },
        { id: "5-1-3", description: "10.5.2.1-5.2.4 Yaw system", serviceType: "1Y" },
        { id: "5-1-4", description: "10.5.2.5 Spring packs", serviceType: "1Y" },
        { id: "5-1-5", description: "10.5.2.6-5.2.7 Lubrication pumps", serviceType: "1Y" },
        { id: "5-1-6", description: "6.5.1.1 Battery Inspection", serviceType: "1Y" },
        { id: "5-1-7", description: "4. 5.2.7.12 M6 bolts rotation transfer", serviceType: "4Y" },
        { id: "5-1-8", description: "6.5.1.2 Replace backup batteries", serviceType: "3Y" },
        { id: "5-1-9", description: "6.5.1.3 Check heater", serviceType: "1Y" },
        { id: "5-1-10", description: "10.5.2.1.1 Clean yaw grease", serviceType: "3Y" }
      ]
    },

    // Step 5.2: Hub Cover (T2) - PARALLEL with 5.1 - 19 tasks
    {
      id: "step-5-2",
      title: "4.5.1.2 Hub Cover\n4.5.1.3 Hub Structure\n4.5.2.7.1 Hub leakage visual inspection\n4.5.1.1 Hub Control Panel ++05\n4.5.1.1.1 Replace back-up batteries\n4.5.1.1.2 Check of the heater\n3.5.5 Anchor points (Hub)\n2.7.3.2 Hub Service LED\n2.7.3.3 Emergency buttons Hub\n2.7.3.4 Warning sounder & lamp Hub\n4.5.2.7.8-5.2.7.9 Visual/Audio axial\n4.5.2.7.10 Lubricate the pitch encoder\n4.5.2.2-5.2.5 Blades External\n4.5.2.7.5 Pre-tension pitch suspension\n4.5.1.5 Examine grease hoses & connecting parts\n4.5.2.7.11 Bolts automatic blade lock\n4.5.2.7.2 Accumulator pressure\n5.2.7.3-4 Check all bolts pitch manifold and accumulator support\n4.5.1.2.4 Check every 10 bolt hub cover",
      duration: "180m + (2Y)105m + (4y)45m + (+)4h",
      durationMinutes: 180,
      color: getServiceTypeColor("Multi"),
      colorCode: "Multi",
      technician: "T2",
      position: { x: 65, y: 9 },
      tasks: [
        { id: "5-2-1", description: "4.5.1.2 Hub Cover", serviceType: "1Y" },
        { id: "5-2-2", description: "4.5.1.3 Hub Structure", serviceType: "1Y" },
        { id: "5-2-3", description: "4.5.2.7.1 Hub leakage visual inspection", serviceType: "1Y" },
        { id: "5-2-4", description: "4.5.1.1 Hub Control Panel ++05", serviceType: "1Y" },
        { id: "5-2-5", description: "4.5.1.1.1 Replace back-up batteries", serviceType: "2Y" },
        { id: "5-2-6", description: "4.5.1.1.2 Check of the heater", serviceType: "1Y" },
        { id: "5-2-7", description: "3.5.5 Anchor points (Hub)", serviceType: "1Y" },
        { id: "5-2-8", description: "2.7.3.2 Hub Service LED", serviceType: "1Y" },
        { id: "5-2-9", description: "2.7.3.3 Emergency buttons Hub", serviceType: "1Y" },
        { id: "5-2-10", description: "2.7.3.4 Warning sounder & lamp Hub", serviceType: "1Y" },
        { id: "5-2-11", description: "4.5.2.7.8-5.2.7.9 Visual/Audio axial", serviceType: "1Y" },
        { id: "5-2-12", description: "4.5.2.7.10 Lubricate the pitch encoder", serviceType: "2Y" },
        { id: "5-2-13", description: "4.5.2.2-5.2.5 Blades External", serviceType: "1Y" },
        { id: "5-2-14", description: "4.5.2.7.5 Pre-tension pitch suspension", serviceType: "1Y" },
        { id: "5-2-15", description: "4.5.1.5 Examine grease hoses & connecting parts", serviceType: "1Y" },
        { id: "5-2-16", description: "4.5.2.7.11 Bolts automatic blade lock", serviceType: "1Y" },
        { id: "5-2-17", description: "4.5.2.7.2 Accumulator pressure", serviceType: "2Y" },
        { id: "5-2-18", description: "5.2.7.3-4 Check all bolts pitch manifold and accumulator support", serviceType: "2Y" },
        { id: "5-2-19", description: "4.5.1.2.4 Check every 10 bolt hub cover", serviceType: "4Y" }
      ]
    },

    // Step 6: Oil samples (Both technicians) - 3 tasks
    {
      id: "step-6",
      title: "6.5.2.1 Gear Oil Sample\n5.5.1.2 Hydraulic Oil sample\n6.5.2.10 Oil level calibration",
      duration: "30m + (2Y)30m",
      durationMinutes: 30,
      color: getServiceTypeColor("Multi"),
      colorCode: "Multi",
      technician: "both",
      position: { x: 81, y: 2 },
      tasks: [
        { id: "6-1", description: "6.5.2.1 Gear Oil Sample", serviceType: "1Y" },
        { id: "6-2", description: "5.5.1.2 Hydraulic Oil sample", serviceType: "1Y" },
        { id: "6-3", description: "6.5.2.10 Oil level calibration", serviceType: "2Y" }
      ]
    },

    // Step 7: Hydraulic system (Both technicians) - 7 tasks
    {
      id: "step-7",
      title: "5.5.1.1 Check hydraulic oil leakage\n5.5.1.5 695-HQ1 air filter replacement\n5.5.3 Hydraulic control panel ++102 (Check filters and heater)\n5.5.2 Brake system (brake test and pre-charge pressure)\n5.5.1.3 Replace filter element return filter\n5.5.1.6 Accumulator pressure Nac\n5.5.1.4 Replace high-presure filter",
      duration: "1h 30m + (2Y)1h 15m + (4y)15m",
      durationMinutes: 90,
      color: getServiceTypeColor("Multi"),
      colorCode: "Multi",
      technician: "both",
      position: { x: 97, y: -1 },
      tasks: [
        { id: "7-1", description: "5.5.1.1 Check hydraulic oil leakage", serviceType: "1Y" },
        { id: "7-2", description: "5.5.1.5 695-HQ1 air filter replacement", serviceType: "1Y" },
        { id: "7-3", description: "5.5.3 Hydraulic control panel ++102 (Check filters and heater)", serviceType: "1Y" },
        { id: "7-4", description: "5.5.2 Brake system (brake test and pre-charge pressure)", serviceType: "1Y" },
        { id: "7-5", description: "5.5.1.3 Replace filter element return filter", serviceType: "2Y" },
        { id: "7-6", description: "5.5.1.6 Accumulator pressure Nac", serviceType: "2Y" },
        { id: "7-7", description: "5.5.1.4 Replace high-presure filter", serviceType: "4Y" }
      ]
    },

    // Step 8.1: Lubricate Blade Bearings (T1) - PARALLEL with 8.2 - 6 tasks
    {
      id: "step-8-1",
      title: "4.5.1.7 Lubricate Blade Bearings\n4.5.1.8 Retighten the blade lock.\n4.5.1.6 Grease collecting cans\n4.5.2.5 LCTU\n4.5.2.1 Blades Internal\n6.5.2.5 Replace air filters",
      duration: "3h",
      durationMinutes: 180,
      color: getServiceTypeColor("Multi"),
      colorCode: "Multi",
      technician: "T1",
      position: { x: 113, y: -8 },
      tasks: [
        { id: "8-1-1", description: "4.5.1.7 Lubricate Blade Bearings", serviceType: "1Y" },
        { id: "8-1-2", description: "4.5.1.8 Retighten the blade lock.", serviceType: "1Y" },
        { id: "8-1-3", description: "4.5.1.6 Grease collecting cans", serviceType: "1Y" },
        { id: "8-1-4", description: "4.5.2.5 LCTU", serviceType: "1Y" },
        { id: "8-1-5", description: "4.5.2.1 Blades Internal", serviceType: "1Y" },
        { id: "8-1-6", description: "6.5.2.5 Replace air filters", serviceType: "1Y" }
      ]
    },

    // Step 8.2: Nacelle control panel (T2) - PARALLEL with 8.1 - 7 tasks
    {
      id: "step-8-2",
      title: "9.5.1 Nacelle control panel ++03\n9.5.1.4 Replace UPS batteries\n9.5.2 AMC panel\n9.5.2.3 Check and replace the fan\n9.5.4 Nacelle Cover\n9.5.5.1 Replace control side fan\nCleaning and hoisting preparation",
      duration: "3h + (3Y)20m + (5Y)1h 30m + (7Y)30m",
      durationMinutes: 180,
      color: getServiceTypeColor("Multi"),
      colorCode: "Multi",
      technician: "T2",
      position: { x: 113, y: 9 },
      tasks: [
        { id: "8-2-1", description: "9.5.1 Nacelle control panel ++03", serviceType: "1Y" },
        { id: "8-2-2", description: "9.5.1.4 Replace UPS batteries", serviceType: "3Y" },
        { id: "8-2-3", description: "9.5.2 AMC panel", serviceType: "1Y" },
        { id: "8-2-4", description: "9.5.2.3 Check and replace the fan", serviceType: "5Y" },
        { id: "8-2-5", description: "9.5.4 Nacelle Cover", serviceType: "1Y" },
        { id: "8-2-6", description: "9.5.5.1 Replace control side fan", serviceType: "7Y" },
        { id: "8-2-7", description: "Cleaning and hoisting preparation", serviceType: "1Y" }
      ]
    },

    // Step 9.1: Climb down (T1) - PARALLEL with 9.2 - 4 tasks
    {
      id: "step-9-1",
      title: "Climb down\n14.5.1-5.2 Inspection tower foundation & flange bolts\n3.5.4 Fall arrest equip.\n3.5.5 Anchor points (Tower)",
      duration: "2h 30m",
      durationMinutes: 150,
      color: getServiceTypeColor("Multi"),
      colorCode: "Multi",
      technician: "T1",
      position: { x: 129, y: -6 },
      tasks: [
        { id: "9-1-1", description: "Climb down", serviceType: "1Y" },
        { id: "9-1-2", description: "14.5.1-5.2 Inspection tower foundation & flange bolts", serviceType: "1Y" },
        { id: "9-1-3", description: "3.5.4 Fall arrest equip.", serviceType: "1Y" },
        { id: "9-1-4", description: "3.5.5 Anchor points (Tower)", serviceType: "1Y" }
      ]
    },

    // Step 9.2: Crane down the material (T2) - PARALLEL with 9.1 - 6 tasks
    {
      id: "step-9-2",
      title: "Crane down the material\n14.5.4 LDST\n14.5.5 Check ladders and platforms\n3.5.4.3-5.4.4 Hatch/swin assembly\n14.5.6 Visual check of the platform hanger assembly\n14.5.7 Check Tower top senction",
      duration: "2h 30m + (4Y)15m",
      durationMinutes: 150,
      color: getServiceTypeColor("Multi"),
      colorCode: "Multi",
      technician: "T2",
      position: { x: 129, y: 9 },
      tasks: [
        { id: "9-2-1", description: "Crane down the material", serviceType: "1Y" },
        { id: "9-2-2", description: "14.5.4 LDST", serviceType: "1Y" },
        { id: "9-2-3", description: "14.5.5 Check ladders and platforms", serviceType: "1Y" },
        { id: "9-2-4", description: "3.5.4.3-5.4.4 Hatch/swin assembly", serviceType: "1Y" },
        { id: "9-2-5", description: "14.5.6 Visual check of the platform hanger assembly", serviceType: "1Y" },
        { id: "9-2-6", description: "14.5.7 Check Tower top senction", serviceType: "4Y" }
      ]
    },

    // Step 10: Final cleaning (Both technicians) - 6 tasks
    {
      id: "step-10",
      title: "2.7.1.1 Emergency buttons\n14.5.13 LB and UPS control panel ++112\n14.5.13.3-4 Replace UPS batteries\nFinal cleaning\n15. Finish work\nReport",
      duration: "1h 30m + (6Y)2h",
      durationMinutes: 90,
      color: getServiceTypeColor("Multi"),
      colorCode: "Multi",
      technician: "both",
      position: { x: 145, y: 0 },
      tasks: [
        { id: "10-1", description: "2.7.1.1 Emergency buttons", serviceType: "1Y" },
        { id: "10-2", description: "14.5.13 LB and UPS control panel ++112", serviceType: "1Y" },
        { id: "10-3", description: "14.5.13.3-4 Replace UPS batteries", serviceType: "6Y" },
        { id: "10-4", description: "Final cleaning", serviceType: "1Y" },
        { id: "10-5", description: "15. Finish work", serviceType: "1Y" },
        { id: "10-6", description: "Report", serviceType: "1Y" }
      ]
    },

    // 4Y bolts 17h - STANDALONE (placed separately, not part of main flow) - 4 tasks
    {
      id: "step-4y-bolts",
      title: "4Y bolts 17h",
      duration: "17h",
      durationMinutes: 1020,
      color: getServiceTypeColor("Multi"),
      colorCode: "Multi",
      technician: "both",
      position: { x: 145, y: 17 },
      tasks: [
        { id: "4y-1", description: "5.1.4.1-2 Check every 10 bolt blade bearing (7h)", serviceType: "4Y" },
        { id: "4y-2", description: "5.2.7.6 Pre-tension every 3. torque arm bolt (3h)", serviceType: "4Y" },
        { id: "4y-3", description: "6.5.4 Main Shaft arrangement (3h)", serviceType: "4Y" },
        { id: "4y-4", description: "10.5.2.3,8,9 Yaw ring, Yaw gear, Yaw Claw (4h)", serviceType: "4Y" }
      ]
    }
  ],
  edges: [
    {
      id: "edge-step-1-step-2-1",
      source: "step-1",
      target: "step-2-1",
      type: "smoothstep",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-1-step-2-2",
      source: "step-1",
      target: "step-2-2",
      type: "smoothstep",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-2-1-step-3",
      source: "step-2-1",
      target: "step-3",
      type: "smoothstep",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-2-2-step-3",
      source: "step-2-2",
      target: "step-3",
      type: "smoothstep",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-3-step-4",
      source: "step-3",
      target: "step-4",
      type: "horizontal",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-4-step-5-1",
      source: "step-4",
      target: "step-5-1",
      type: "smoothstep",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-4-step-5-2",
      source: "step-4",
      target: "step-5-2",
      type: "smoothstep",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-5-1-step-6",
      source: "step-5-1",
      target: "step-6",
      type: "smoothstep",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-5-2-step-6",
      source: "step-5-2",
      target: "step-6",
      type: "smoothstep",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-6-step-7",
      source: "step-6",
      target: "step-7",
      type: "horizontal",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-7-step-8-1",
      source: "step-7",
      target: "step-8-1",
      type: "smoothstep",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-7-step-8-2",
      source: "step-7",
      target: "step-8-2",
      type: "smoothstep",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-8-1-step-9-1",
      source: "step-8-1",
      target: "step-9-1",
      type: "horizontal",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-8-2-step-9-2",
      source: "step-8-2",
      target: "step-9-2",
      type: "horizontal",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-9-1-step-10",
      source: "step-9-1",
      target: "step-10",
      type: "smoothstep",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-9-2-step-10",
      source: "step-9-2",
      target: "step-10",
      type: "smoothstep",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    },
    {
      id: "edge-step-10-4y-bolts",
      source: "step-10",
      target: "step-4y-bolts",
      type: "straight",
      sourceHandle: "bottom-source",
      targetHandle: "top-target"
    }
  ]
};

export const ALL_FLOWCHARTS: FlowchartData[] = [
  ENVENTUS_MK0_1Y
];

export interface TurbineModel {
  id: string;
  name: string;
  flowcharts: FlowchartData[];
}

export const TURBINE_MODELS: TurbineModel[] = [
  {
    id: "enventus-mk0",
    name: "EnVentus Mk 0",
    flowcharts: [ENVENTUS_MK0_1Y]
  }
];

// ==========================================
// Local Storage Management Functions
// ==========================================

const STORAGE_KEY = "custom_flowcharts";

/**
 * Load custom flowcharts from localStorage
 */
export function loadCustomFlowcharts(): FlowchartData[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const data = JSON.parse(stored);
    return Object.values(data) as FlowchartData[];
  } catch (error) {
    console.error("Failed to load custom flowcharts:", error);
    return [];
  }
}

/**
 * Save a flowchart to localStorage
 */
export function saveFlowchart(flowchart: FlowchartData): void {
  if (typeof window === "undefined") return;

  try {
    // Mark as custom and add timestamps
    const flowchartToSave: FlowchartData = {
      ...flowchart,
      isCustom: true,
      updatedAt: new Date().toISOString(),
      createdAt: flowchart.createdAt || new Date().toISOString()
    };

    // Load existing flowcharts
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};

    // Add/update flowchart
    data[flowchart.id] = flowchartToSave;

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save flowchart:", error);
    throw error;
  }
}

/**
 * Delete a custom flowchart from localStorage
 */
export function deleteFlowchart(flowchartId: string): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const data = JSON.parse(stored);
    delete data[flowchartId];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to delete flowchart:", error);
    throw error;
  }
}

/**
 * Reset a flowchart to its default layout by removing custom saved data
 * This ensures the default positions and connections are always used
 */
export function resetToDefaultLayout(flowchartId: string): void {
  if (typeof window === "undefined") return;

  try {
    // Delete any custom saved version
    deleteFlowchart(flowchartId);

    console.log(`Reset flowchart ${flowchartId} to default layout`);
  } catch (error) {
    console.error("Failed to reset flowchart to default:", error);
  }
}

/**
 * Export flowchart as JSON file
 */
export function exportFlowchartJSON(flowchart: FlowchartData): void {
  try {
    const json = JSON.stringify(flowchart, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${flowchart.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export flowchart:", error);
    throw error;
  }
}

/**
 * Import flowchart from JSON file
 */
export async function importFlowchartJSON(file: File): Promise<FlowchartData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const flowchart = JSON.parse(json) as FlowchartData;

        // Validate required fields
        if (!flowchart.id || !flowchart.model || !flowchart.steps) {
          throw new Error("Invalid flowchart format");
        }

        resolve(flowchart);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Get all flowcharts (hardcoded + custom)
 */
export function getAllFlowcharts(): TurbineModel[] {
  const customFlowcharts = loadCustomFlowcharts();

  // Group custom flowcharts by model
  const customByModel = new Map<string, FlowchartData[]>();
  customFlowcharts.forEach(fc => {
    const existing = customByModel.get(fc.model) || [];
    customByModel.set(fc.model, [...existing, fc]);
  });

  // Merge with hardcoded models
  const allModels = [...TURBINE_MODELS];

  customByModel.forEach((flowcharts, modelName) => {
    const existingModel = allModels.find(m => m.name === modelName);
    if (existingModel) {
      existingModel.flowcharts = [...existingModel.flowcharts, ...flowcharts];
    } else {
      allModels.push({
        id: `custom-${modelName.toLowerCase().replace(/\s+/g, "-")}`,
        name: modelName,
        flowcharts
      });
    }
  });

  return allModels;
}

/**
 * Generate a unique ID for a new flowchart
 */
export function generateFlowchartId(model: string, serviceType: string): string {
  const timestamp = Date.now();
  const modelSlug = model.toLowerCase().replace(/\s+/g, "-");
  const serviceSlug = serviceType.toLowerCase().replace(/\s+/g, "-");
  return `custom-${modelSlug}-${serviceSlug}-${timestamp}`;
}

/**
 * Generate a unique ID for a new step
 */
export function generateStepId(): string {
  return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique ID for a new task
 */
export function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
