export interface FlowchartTask {
  id: string;
  description: string;
  completed?: boolean;
  startTime?: string;
  endTime?: string;
}

export interface FlowchartStep {
  id: string;
  title: string;
  duration: string;
  durationMinutes: number;
  color: string;
  colorCode: string; // e.g., "2Y", "3Y", "5Y", etc.
  technician: "T1" | "T2" | "both";
  position: { x: number; y: number };
  tasks: FlowchartTask[];
  documents?: string[];
  media?: string[];
  notes?: string;
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
  isCustom?: boolean; // True for user-created flowcharts
  createdAt?: string;
  updatedAt?: string;
}

// EnVentus Mk 0 - 1Y Service Flowchart
// Steps reorganized to match PDF flowchart sequence (Flowchart 2.pdf)
// Parallel steps: 2, 5, 6, 8, 9
// Sequential steps: 1, 3, 4, 7, 10
// Standalone: 4Y bolts 17h
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
  steps: [
    // Step 1: PPE equipment on (Both technicians)
    {
      id: "step-1",
      title: "PPE equipment on\n1. Prepare for Service",
      duration: "60m",
      durationMinutes: 60,
      color: "#FF9800",
      colorCode: "1Y",
      technician: "both",
      position: { x: 0, y: 0 },
      tasks: [
        { id: "1-1", description: "PPE equipment on" },
        { id: "1-2", description: "1. Prepare for Service" }
      ]
    },

    // Step 2.1: Lift check (T1) - PARALLEL with 2.2
    {
      id: "step-2-1",
      title: "13.5.1 Lift check\nLift up\nVisual insp. Nacelle\nCrane down\n11.5.1. Examine crane\nCrane up\n2.7.2.3 Warning sounder & lamp Nacelle\n10.5.2.1 Yaw unusual noise",
      duration: "150m",
      durationMinutes: 150,
      color: "#FF9800",
      colorCode: "2Y",
      technician: "T1",
      position: { x: 1, y: 0 },
      tasks: [
        { id: "2-1-1", description: "13.5.1 Lift check" },
        { id: "2-1-2", description: "Lift up" },
        { id: "2-1-3", description: "Visual insp. Nacelle" },
        { id: "2-1-4", description: "Crane down" },
        { id: "2-1-5", description: "11.5.1. Examine crane" },
        { id: "2-1-6", description: "Crane up" },
        { id: "2-1-7", description: "2.7.2.3 Warning sounder & lamp Nacelle" },
        { id: "2-1-8", description: "10.5.2.1 Yaw unusual noise" }
      ]
    },

    // Step 2.2: Prep bags and tools (T2) - PARALLEL with 2.1
    {
      id: "step-2-2",
      title: "Prep bags and tools\n14.5.11 Earthing system\n14.5.9 Dehumidifier\n14.5.8 Door filter\n14.5.10 Tower surface\n14.5.12 Ground control panel ++01\n2.7.1.2 Warning sounder & lamp Tower",
      duration: "150m",
      durationMinutes: 150,
      color: "#9C27B0",
      colorCode: "1Y",
      technician: "T2",
      position: { x: 1, y: 1 },
      tasks: [
        { id: "2-2-1", description: "Prep bags and tools" },
        { id: "2-2-2", description: "14.5.11 Earthing system" },
        { id: "2-2-3", description: "14.5.9 Dehumidifier" },
        { id: "2-2-4", description: "14.5.8 Door filter" },
        { id: "2-2-5", description: "14.5.10 Tower surface" },
        { id: "2-2-6", description: "14.5.12 Ground control panel ++01" },
        { id: "2-2-7", description: "2.7.1.2 Warning sounder & lamp Tower" }
      ]
    },

    // Step 3: Prep in turbine (Both technicians)
    {
      id: "step-3",
      title: "Prep in turbine\n2.7.2 Safety test Nacelle\n3.5.1-5.3 ResQ equip., extinguishers & first-aid kits\n3.5.5 Anchor points (Nacelle)\nSpinner outside\n6.5.6 Rotor lock system\n6.5.4.8-5.4.9 Expansion disc main shaft\n6.5.5 Bulkheads main shaft",
      duration: "90m",
      durationMinutes: 90,
      color: "#4CAF50",
      colorCode: "1Y",
      technician: "both",
      position: { x: 2, y: 0 },
      tasks: [
        { id: "3-1", description: "Prep in turbine" },
        { id: "3-2", description: "2.7.2 Safety test Nacelle" },
        { id: "3-3", description: "3.5.1-5.3 ResQ equip., extinguishers & first-aid kits" },
        { id: "3-4", description: "3.5.5 Anchor points (Nacelle)" },
        { id: "3-5", description: "Spinner outside" },
        { id: "3-6", description: "6.5.6 Rotor lock system" },
        { id: "3-7", description: "6.5.4.8-5.4.9 Expansion disc main shaft" },
        { id: "3-8", description: "6.5.5 Bulkheads main shaft" }
      ]
    },

    // Step 4: Generator (T1)
    {
      id: "step-4",
      title: "7. Generator\n6.5.2.11 Visual inspection for leakages in hoses\n6.5.2.2 Replace 50 um filter\n6.5.2.3 Replace inline filter\n6.5.2.4 Replace offline filter\n6.6.2.6 Replace the Value actuators\n6.6.2.7 Replace the oil pumpmotor and clutch\n6.5.2.8 Replace the VFD\n6.5.2.9 Validate pressure transmitters\n6.5.2.12 Visual inspec. leakages in lubrication hoses\n6.5.3 Visual inspection and replace filter mat AVC system\n9.5.3.1 Inspect brushes for wear\n6.5.2.13 Repair and replace oil debris monitor system",
      duration: "120m + (2Y)120m + (4Y)5m + (5Y)195m + (6Y)6h + (10Y)3h",
      durationMinutes: 120,
      color: "#2196F3",
      colorCode: "Multi",
      technician: "T1",
      position: { x: 3, y: 0 },
      tasks: [
        { id: "4-1", description: "7. Generator" },
        { id: "4-2", description: "6.5.2.11 Visual inspection for leakages in hoses" },
        { id: "4-3", description: "6.5.2.2 Replace 50 um filter" },
        { id: "4-4", description: "6.5.2.3 Replace inline filter" },
        { id: "4-5", description: "6.5.2.4 Replace offline filter" },
        { id: "4-6", description: "6.6.2.6 Replace the Value actuators" },
        { id: "4-7", description: "6.6.2.7 Replace the oil pumpmotor and clutch" },
        { id: "4-8", description: "6.5.2.8 Replace the VFD" },
        { id: "4-9", description: "6.5.2.9 Validate pressure transmitters" },
        { id: "4-10", description: "6.5.2.12 Visual inspec. leakages in lubrication hoses" },
        { id: "4-11", description: "6.5.3 Visual inspection and replace filter mat AVC system" },
        { id: "4-12", description: "9.5.3.1 Inspect brushes for wear" },
        { id: "4-13", description: "6.5.2.13 Repair and replace oil debris monitor system" }
      ]
    },

    // Step 5.1: CubePower and Yaw system (T1) - PARALLEL with 5.2
    {
      id: "step-5-1",
      title: "8.5.2 Replace CubePower air filters\n10.5.1 Yaw control panel ++68\n10.5.2.1-5.2.4 Yaw system\n10.5.2.5 Spring packs\n10.5.2.6-5.2.7 Lubrication pumps\n6.5.1.1 Battery Inspection\n4. 5.2.7.12 M6 bolts rotation transfer\n6.5.1.2 Replace backup batteries\n6.5.1.3 Check heater\n10.5.2.1.1 Clean yaw grease",
      duration: "180m + (2Y)105m + (4y)45m + (+)4h",
      durationMinutes: 180,
      color: "#FF5722",
      colorCode: "Multi",
      technician: "T1",
      position: { x: 4, y: 0 },
      tasks: [
        { id: "5-1-1", description: "8.5.2 Replace CubePower air filters" },
        { id: "5-1-2", description: "10.5.1 Yaw control panel ++68" },
        { id: "5-1-3", description: "10.5.2.1-5.2.4 Yaw system" },
        { id: "5-1-4", description: "10.5.2.5 Spring packs" },
        { id: "5-1-5", description: "10.5.2.6-5.2.7 Lubrication pumps" },
        { id: "5-1-6", description: "6.5.1.1 Battery Inspection" },
        { id: "5-1-7", description: "4. 5.2.7.12 M6 bolts rotation transfer" },
        { id: "5-1-8", description: "6.5.1.2 Replace backup batteries" },
        { id: "5-1-9", description: "6.5.1.3 Check heater" },
        { id: "5-1-10", description: "10.5.2.1.1 Clean yaw grease" }
      ]
    },

    // Step 5.2: Hub Cover (T2) - PARALLEL with 5.1
    {
      id: "step-5-2",
      title: "4.5.1.2 Hub Cover\n4.5.1.3 Hub Structure\n4.5.2.7.1 Hub leakage visual inspection\n4.5.1.1 Hub Control Panel ++05\n4.5.1.1.1 Replace back-up batteries\n4.5.1.1.2 Check of the heater\n3.5.5 Anchor points (Hub)\n2.7.3.2 Hub Service LED\n2.7.3.3 Emergency buttons Hub\n2.7.3.4 Warning sounder & lamp Hub\n4.5.2.7.8-5.2.7.9 Visual/Audio axial\n4.5.2.7.10 Lubricate the pitch encoder\n4.5.2.2-5.2.5 Blades External\n4.5.2.7.5 Pre-tension pitch suspension\n4.5.1.5 Examine grease hoses & connecting parts\n4.5.2.7.11 Bolts automatic blade lock\n4.5.2.7.2 Accumulator pressure\n5.2.7.3-4 Check all bolts pitch manifold and accumulator support\n4.5.1.2.4 Check every 10 bolt hub cover",
      duration: "90m + (6Y)120m",
      durationMinutes: 90,
      color: "#E91E63",
      colorCode: "6Y",
      technician: "T2",
      position: { x: 4, y: 1 },
      tasks: [
        { id: "5-2-1", description: "4.5.1.2 Hub Cover" },
        { id: "5-2-2", description: "4.5.1.3 Hub Structure" },
        { id: "5-2-3", description: "4.5.2.7.1 Hub leakage visual inspection" },
        { id: "5-2-4", description: "4.5.1.1 Hub Control Panel ++05" },
        { id: "5-2-5", description: "4.5.1.1.1 Replace back-up batteries" },
        { id: "5-2-6", description: "4.5.1.1.2 Check of the heater" },
        { id: "5-2-7", description: "3.5.5 Anchor points (Hub)" },
        { id: "5-2-8", description: "2.7.3.2 Hub Service LED" },
        { id: "5-2-9", description: "2.7.3.3 Emergency buttons Hub" },
        { id: "5-2-10", description: "2.7.3.4 Warning sounder & lamp Hub" },
        { id: "5-2-11", description: "4.5.2.7.8-5.2.7.9 Visual/Audio axial" },
        { id: "5-2-12", description: "4.5.2.7.10 Lubricate the pitch encoder" },
        { id: "5-2-13", description: "4.5.2.2-5.2.5 Blades External" },
        { id: "5-2-14", description: "4.5.2.7.5 Pre-tension pitch suspension" },
        { id: "5-2-15", description: "4.5.1.5 Examine grease hoses & connecting parts" },
        { id: "5-2-16", description: "4.5.2.7.11 Bolts automatic blade lock" },
        { id: "5-2-17", description: "4.5.2.7.2 Accumulator pressure" },
        { id: "5-2-18", description: "5.2.7.3-4 Check all bolts pitch manifold and accumulator support" },
        { id: "5-2-19", description: "4.5.1.2.4 Check every 10 bolt hub cover" }
      ]
    },

    // Step 6: Oil samples (Both technicians)
    {
      id: "step-6",
      title: "6.5.2.1 Gear Oil Sample\n5.5.1.2 Hydraulic Oil sample\n6.5.2.10 Oil level calibration",
      duration: "30m + (2Y)30m",
      durationMinutes: 30,
      color: "#FFC107",
      colorCode: "2Y",
      technician: "both",
      position: { x: 5, y: 0 },
      tasks: [
        { id: "6-1", description: "6.5.2.1 Gear Oil Sample" },
        { id: "6-2", description: "5.5.1.2 Hydraulic Oil sample" },
        { id: "6-3", description: "6.5.2.10 Oil level calibration" }
      ]
    },

    // Step 7: Hydraulic system (Both technicians)
    {
      id: "step-7",
      title: "5.5.1.1 Check hydraulic oil leakage\n5.5.1.5 695-HQ1 air filter replacement\n5.5.3 Hydraulic control panel ++102 (Check filters and heater)\n5.5.2 Brake system (brake test and pre-charge pressure)\n5.5.1.3 Replace filter element return filter\n5.5.1.6 Accumulator pressure Nac\n5.5.1.4 Replace high-presure filter",
      duration: "90m + (2Y)75m + (4y)15m",
      durationMinutes: 90,
      color: "#00BCD4",
      colorCode: "Multi",
      technician: "both",
      position: { x: 6, y: 0 },
      tasks: [
        { id: "7-1", description: "5.5.1.1 Check hydraulic oil leakage" },
        { id: "7-2", description: "5.5.1.5 695-HQ1 air filter replacement" },
        { id: "7-3", description: "5.5.3 Hydraulic control panel ++102 (Check filters and heater)" },
        { id: "7-4", description: "5.5.2 Brake system (brake test and pre-charge pressure)" },
        { id: "7-5", description: "5.5.1.3 Replace filter element return filter" },
        { id: "7-6", description: "5.5.1.6 Accumulator pressure Nac" },
        { id: "7-7", description: "5.5.1.4 Replace high-presure filter" }
      ]
    },

    // Step 8.1: Lubricate Blade Bearings (T1) - PARALLEL with 8.2
    {
      id: "step-8-1",
      title: "4.5.1.7 Lubricate Blade Bearings\n4.5.1.8 Retighten the blade lock\n4.5.1.6 Grease collecting cans\n4.5.2.5 LCTU\n4.5.2.1 Blades Internal\n6.5.2.5 Replace air filters",
      duration: "180m",
      durationMinutes: 180,
      color: "#8BC34A",
      colorCode: "3Y",
      technician: "T1",
      position: { x: 7, y: 0 },
      tasks: [
        { id: "8-1-1", description: "4.5.1.7 Lubricate Blade Bearings" },
        { id: "8-1-2", description: "4.5.1.8 Retighten the blade lock" },
        { id: "8-1-3", description: "4.5.1.6 Grease collecting cans" },
        { id: "8-1-4", description: "4.5.2.5 LCTU" },
        { id: "8-1-5", description: "4.5.2.1 Blades Internal" },
        { id: "8-1-6", description: "6.5.2.5 Replace air filters" }
      ]
    },

    // Step 8.2: Nacelle control panel (T2) - PARALLEL with 8.1
    {
      id: "step-8-2",
      title: "9.5.1 Nacelle control panel ++03\n9.5.1.4 Replace UPS batteries\n9.5.2 AMC panel\n9.5.2.3 Check and replace the fan\n9.5.4 Nacelle Cover\n9.5.5.1 Replace control side fan\nCleaning and hoisting preparation",
      duration: "180m + (3Y)20m + (5Y)90m + (7Y)30m",
      durationMinutes: 180,
      color: "#9C27B0",
      colorCode: "Multi",
      technician: "T2",
      position: { x: 7, y: 1 },
      tasks: [
        { id: "8-2-1", description: "9.5.1 Nacelle control panel ++03" },
        { id: "8-2-2", description: "9.5.1.4 Replace UPS batteries" },
        { id: "8-2-3", description: "9.5.2 AMC panel" },
        { id: "8-2-4", description: "9.5.2.3 Check and replace the fan" },
        { id: "8-2-5", description: "9.5.4 Nacelle Cover" },
        { id: "8-2-6", description: "9.5.5.1 Replace control side fan" },
        { id: "8-2-7", description: "Cleaning and hoisting preparation" }
      ]
    },

    // Step 9.1: Climb down (T1) - PARALLEL with 9.2
    {
      id: "step-9-1",
      title: "Climb down\n14.5.1-5.2 Inspection tower foundation & flange bolts\n3.5.4 Fall arrest equip.\n3.5.5 Anchor points (Tower)",
      duration: "150m",
      durationMinutes: 150,
      color: "#FF9800",
      colorCode: "1Y",
      technician: "T1",
      position: { x: 8, y: 0 },
      tasks: [
        { id: "9-1-1", description: "Climb down" },
        { id: "9-1-2", description: "14.5.1-5.2 Inspection tower foundation & flange bolts" },
        { id: "9-1-3", description: "3.5.4 Fall arrest equip." },
        { id: "9-1-4", description: "3.5.5 Anchor points (Tower)" }
      ]
    },

    // Step 9.2: Crane down the material (T2) - PARALLEL with 9.1
    {
      id: "step-9-2",
      title: "Crane down the material\n14.5.4 LDST\n14.5.5 Check ladders and platforms\n3.5.4.3-5.4.4 Hatch/swin assembly\n14.5.6 Visual check of the platform hanger assembly\n14.5.7 Check Tower top senction",
      duration: "150m + (4Y)15m",
      durationMinutes: 150,
      color: "#2196F3",
      colorCode: "4Y",
      technician: "T2",
      position: { x: 8, y: 1 },
      tasks: [
        { id: "9-2-1", description: "Crane down the material" },
        { id: "9-2-2", description: "14.5.4 LDST" },
        { id: "9-2-3", description: "14.5.5 Check ladders and platforms" },
        { id: "9-2-4", description: "3.5.4.3-5.4.4 Hatch/swin assembly" },
        { id: "9-2-5", description: "14.5.6 Visual check of the platform hanger assembly" },
        { id: "9-2-6", description: "14.5.7 Check Tower top senction" }
      ]
    },

    // Step 10: Final cleaning (Both technicians)
    {
      id: "step-10",
      title: "2.7.1.1 Emergency buttons\n14.5.13 LB and UPS control panel ++112\n14.5.13.3-4 Replace UPS batteries\nFinal cleaning\n15. Finish work\nReport",
      duration: "90m + (6Y)120m",
      durationMinutes: 90,
      color: "#795548",
      colorCode: "6Y",
      technician: "both",
      position: { x: 9, y: 0 },
      tasks: [
        { id: "10-1", description: "2.7.1.1 Emergency buttons" },
        { id: "10-2", description: "14.5.13 LB and UPS control panel ++112" },
        { id: "10-3", description: "14.5.13.3-4 Replace UPS batteries" },
        { id: "10-4", description: "Final cleaning" },
        { id: "10-5", description: "15. Finish work" },
        { id: "10-6", description: "Report" }
      ]
    },

    // 4Y bolts 17h - STANDALONE (placed separately at bottom)
    {
      id: "step-4y-bolts",
      title: "4Y bolts 17h",
      duration: "17h",
      durationMinutes: 1020,
      color: "#FF5722",
      colorCode: "4Y",
      technician: "T1",
      position: { x: 0, y: 3 },
      tasks: [
        { id: "4y-1", description: "5.1.4.1-2 Check every 10 bolt blade bearing (7h)" },
        { id: "4y-2", description: "5.2.7.6 Pre-tension every 3. torque arm bolt (3h)" },
        { id: "4y-3", description: "6.5.4 Main Shaft arrangement (3h)" },
        { id: "4y-4", description: "10.5.2.3,8,9 Yaw ring, Yaw gear, Yaw Claw (4h)" }
      ]
    }
  ]
};

export const ALL_FLOWCHARTS: FlowchartData[] = [
  ENVENTUS_MK0_1Y
];

export const TURBINE_MODELS = [
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
export function getAllFlowcharts(): { model: string; flowcharts: FlowchartData[] }[] {
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
