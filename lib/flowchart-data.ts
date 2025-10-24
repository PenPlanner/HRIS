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
}

// EnVentus Mk 0 - 1Y Service Flowchart
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
    {
      id: "step-1",
      title: "PPE equipment on\n1. Prepare for Service",
      duration: "60m",
      durationMinutes: 60,
      color: "#FF9800",
      colorCode: "2Y",
      technician: "both",
      position: { x: 0, y: 0 },
      tasks: [
        { id: "1-1", description: "PPE equipment on" },
        { id: "1-2", description: "Prepare for Service" }
      ]
    },
    {
      id: "step-2",
      title: "4Y bolts 17h",
      duration: "150m",
      durationMinutes: 150,
      color: "#2196F3",
      colorCode: "4Y",
      technician: "T1",
      position: { x: 1, y: 0 },
      tasks: [
        { id: "2-1", description: "5.1.4-1-2 Check every 10 bolt blade bearing (7h)" },
        { id: "2-2", description: "5.2.7.6 Pre-tension every 3. torque arm bolt (3h)" },
        { id: "2-3", description: "6.5.4 Main Shaft arrangement (3h)" },
        { id: "2-4", description: "10.5.2.3,8,9 Yaw ring, Yaw gear, Yaw Claw (4h)" }
      ]
    },
    {
      id: "step-3",
      title: "13.5.1 Lift check\nPrep bags and tools\n14.5.11 Earthing system\n14.5.9 Dehumidifier\n14.5.8 Door filter\n14.5.10 Tower surface",
      duration: "150m",
      durationMinutes: 150,
      color: "#FF9800",
      colorCode: "T2",
      technician: "T2",
      position: { x: 2, y: -2 },
      tasks: [
        { id: "3-1", description: "13.5.1 Lift check" },
        { id: "3-2", description: "Prep bags and tools" },
        { id: "3-3", description: "14.5.11 Earthing system" },
        { id: "3-4", description: "14.5.9 Dehumidifier" },
        { id: "3-5", description: "14.5.8 Door filter" },
        { id: "3-6", description: "14.5.10 Tower surface" },
        { id: "3-7", description: "14.5.12 Ground control panel ++01" },
        { id: "3-8", description: "2.7.1.2 Warning sounder & lamp Tower" }
      ]
    },
    {
      id: "step-4",
      title: "Prep in turbine\n2.7.2 Safety Test Nacelle\n3.5.1-5.3 ResQ equip.\nextinguishers & first-aid kits\n3.5.5 Anchor points (Nacelle)\nSpinner outside\n6.5.6 Rotor lock system\n6.5.4.8-5.4.9 Expansion disc main shaft\n6.5.5 Bulkheads main shaft",
      duration: "90m",
      durationMinutes: 90,
      color: "#4CAF50",
      colorCode: "T1",
      technician: "T1",
      position: { x: 3, y: -1 },
      tasks: [
        { id: "4-1", description: "2.7.2 Safety test Nacelle" },
        { id: "4-2", description: "3.5.1-5.3 ResQ equip., extinguishers & first-aid kits" },
        { id: "4-3", description: "3.5.5 Anchor points (Nacelle)" },
        { id: "4-4", description: "Spinner outside" },
        { id: "4-5", description: "6.5.6 Rotor lock system" },
        { id: "4-6", description: "6.5.4.8-5.4.9 Expansion disc main shaft" },
        { id: "4-7", description: "6.5.5 Bulkheads main shaft" }
      ]
    },
    {
      id: "step-5",
      title: "7. Generator\n6.5.2.11 Visual Inspection for leakages in hoses\n6.5.2.2 Replace 50 um filter\n6.5.2.3 Replace inline filter\n6.5.2.4 Replace offline filter\n6.6.2.6 Replace the Value actuators\n6.6.2.7 Replace the oil pump motor and clutch\n6.5.2.8 Replace the VFD\n6.5.2.9 Validate pressure transmission\n6.5.2.12 Visual Insp. leakages in lubrication hoses\n6.5.3 Visual Inspection and replace filter of CLC system\n9.5.3.1 Inspect brushes for wear\n6.5.2.13 Repair and change oil debris monitor system",
      duration: "120m + (2Y)120m + (4Y)5m + (5Y)195m + (6V)6m + (10Y)5m",
      durationMinutes: 120,
      color: "#FF9800",
      colorCode: "Multi",
      technician: "T1",
      position: { x: 4, y: -1 },
      tasks: [
        { id: "5-1", description: "6.5.2.11 Visual inspection for leakages in hoses" },
        { id: "5-2", description: "6.5.2.2 Replace 50 um filter" },
        { id: "5-3", description: "6.5.2.3 Replace inline filter" },
        { id: "5-4", description: "6.5.2.4 Replace offline filter" },
        { id: "5-5", description: "6.6.2.6 Replace the Value actuators" },
        { id: "5-6", description: "6.6.2.7 Replace the oil pump motor and clutch" },
        { id: "5-7", description: "6.5.2.8 Replace the VFD" },
        { id: "5-8", description: "6.5.2.9 Validate pressure transmission" },
        { id: "5-9", description: "6.5.2.12 Visual inspec. leakages in lubrication hoses" }
      ]
    },
    {
      id: "step-6",
      title: "30m + (2Y)30m",
      duration: "30m+",
      durationMinutes: 30,
      color: "#FF9800",
      colorCode: "2Y",
      technician: "T2",
      position: { x: 1, y: 1 },
      tasks: [
        { id: "6-1", description: "6.5.2.1 Gear Oil Sample" },
        { id: "6-2", description: "5.5.1.2 Hydraulic Oil sample" },
        { id: "6-3", description: "6.5.2.10 Oil level calibration" }
      ]
    },
    {
      id: "step-7",
      title: "90m + (2Y)75m + (4y)15m",
      duration: "90m+",
      durationMinutes: 90,
      color: "#2196F3",
      colorCode: "Multi",
      technician: "T2",
      position: { x: 2, y: 1 },
      tasks: [
        { id: "7-1", description: "5.5.1.3 Check hydraulic oil leakage" },
        { id: "7-2", description: "5.5.1.5 695-HQ1 air filter replacement" },
        { id: "7-3", description: "5.5.3 Hydraulic control panel ++102 (Check filters and heater)" },
        { id: "7-4", description: "5.5.2 Brake system (brakes + pre-charge pressure)" },
        { id: "7-5", description: "5.5.1.3 Replace filter element return filter" },
        { id: "7-6", description: "5.5.1.6 Accumulator pressure Nac" },
        { id: "7-7", description: "5.5.1.4 Replace high-presure filter" }
      ]
    },
    {
      id: "step-8",
      title: "180m + (3Y)20m + (5Y)90m + (7Y)30m",
      duration: "180m+",
      durationMinutes: 180,
      color: "#FFC107",
      colorCode: "Multi",
      technician: "T2",
      position: { x: 3, y: 1 },
      tasks: [
        { id: "8-1", description: "4.5.1.7 Lubricate Blade Bearings" },
        { id: "8-2", description: "4.5.1.8 Retighten the blade lock" },
        { id: "8-3", description: "4.5.2.1.6 Grease collecting cans" },
        { id: "8-4", description: "4.5.2.5 LCTU" },
        { id: "8-5", description: "4.5.2.1 Blades Internal" },
        { id: "8-6", description: "4.5.2.5 Replace air filters" }
      ]
    },
    {
      id: "step-9",
      title: "9.5.1 Nacelle control panel ++03\n9.5.1.4 Replace UPS batteries\n9.5.2 AMC panel\n9.5.2.1 Check and replace the fan\n9.5.4 Nacelle Cover\n9.5.5.1 Replace control side fan\nCleaning and hoisting preparation",
      duration: "180m + (3Y)20m + (5Y)90m + (7Y)30m",
      durationMinutes: 180,
      color: "#9C27B0",
      colorCode: "Multi",
      technician: "T2",
      position: { x: 4, y: 1 },
      tasks: [
        { id: "9-1", description: "9.5.1 Nacelle control panel ++03" },
        { id: "9-2", description: "9.5.1.4 Replace UPS batteries" },
        { id: "9-3", description: "9.5.2 AMC panel" },
        { id: "9-4", description: "9.5.2.1 Check and replace the fan" },
        { id: "9-5", description: "9.5.4 Nacelle Cover" },
        { id: "9-6", description: "9.5.5.1 Replace control side fan" },
        { id: "9-7", description: "Cleaning and hoisting preparation" }
      ]
    },
    {
      id: "step-10",
      title: "8.5.2 Replace CubePower air filters\n10.5.1 Yaw control panel ++68\n10.5.2.1-5.2.4 Yaw system\n10.5.2.5 Spring packs\n10.5.2.6-5.2.7 Lubrication pumps\n6.5.1.1 Battery Inspection\n4. 5.2.7.12 Mk bolts rotation transfer\n6.5.1.2 Replace backup batteries\n6.5.1.3 Check heater\n10.5.2.1.1 Clean yaw grease",
      duration: "180m + (2Y)105m + (4y)45m + (-)4h",
      durationMinutes: 180,
      color: "#FF5722",
      colorCode: "Multi",
      technician: "T1",
      position: { x: 5, y: -1 },
      tasks: [
        { id: "10-1", description: "8.5.2 Replace CubePower air filters" },
        { id: "10-2", description: "10.5.1 Yaw control panel ++68" },
        { id: "10-3", description: "10.5.2.1-5.2.4 Yaw system" },
        { id: "10-4", description: "10.5.2.5 Spring packs" },
        { id: "10-5", description: "10.5.2.6-5.2.7 Lubrication pumps" },
        { id: "10-6", description: "6.5.1.1 Battery Inspection" },
        { id: "10-7", description: "4. 5.2.7.12 Mk bolts rotation transfer" },
        { id: "10-8", description: "6.5.1.2 Replace backup batteries" },
        { id: "10-9", description: "6.5.1.3 Check heater" },
        { id: "10-10", description: "4.5.2.1.1 Clean yaw grease" }
      ]
    },
    {
      id: "step-11",
      title: "Climb down\n14.5.1-5.2 Inspection tower foundation & flange bolts\n3.5.4 Fall arrest equip.\n3.5.5 Anchor points (Tower)",
      duration: "150m + (4Y)15m",
      durationMinutes: 150,
      color: "#2196F3",
      colorCode: "4Y",
      technician: "T1",
      position: { x: 5, y: -2 },
      tasks: [
        { id: "11-1", description: "Climb down" },
        { id: "11-2", description: "14.5.1-5.2 Visual check of tower, foundation & flange bolts" },
        { id: "11-3", description: "3.5.4 Fall arrest equip." },
        { id: "11-4", description: "3.5.5 Anchor points (Tower)" }
      ]
    },
    {
      id: "step-12",
      title: "4.5.1.2 Hub Cover\n4.5.1.3 Hub Structure\n4.5.2.7.1 Hub leakage visual inspection\n4.5.1.1 Hub Control Panel ++05\n4.5.1.1.1 Replace back-up batteries\n4.5.1.1.2 Check of the heater\n3.5.5 Anchor points (Hub)\n2.7.3.2 Hub Service LED\n2.7.3.3 Emergency buttons Hub\n2.7.3.4 Warning sounder & lamp Hub\n4.5.2.7.8-5.2.7.9 Visual/Audio axial\n4.5.2.7.10 Lubricate the pitch encoder\n4.5.2.2-5.2.5 Blades External\n4.5.2.7.5 Pre-tension pitch suspension\n4.5.1.5 Examine grease hoses & connecting parts\n4.5.2.7.11 Bolts automatic blade lock\n4.5.2.7.2 Accumulator pressure\n5.2.7.3-4 Check all bolts pitch manifold and accumulator support\n4.5.1.2-4 Check every 10 bolt hub cover",
      duration: "90m + (6V)120m",
      durationMinutes: 90,
      color: "#E91E63",
      colorCode: "T2",
      technician: "T2",
      position: { x: 6, y: -1 },
      tasks: [
        { id: "12-1", description: "4.5.1.2 Hub Cover" },
        { id: "12-2", description: "4.5.1.3 Hub Structure" },
        { id: "12-3", description: "4.5.2.7.1 Hub leakage visual inspection" },
        { id: "12-4", description: "4.5.1.1 Hub Control Panel ++05" },
        { id: "12-5", description: "4.5.1.1.1 Replace back-up batteries" },
        { id: "12-6", description: "4.5.1.1.2 Check of the heater" },
        { id: "12-7", description: "3.5.5 Anchor points (Hub)" },
        { id: "12-8", description: "2.7.3.2 Hub Service LED" },
        { id: "12-9", description: "2.7.3.3 Emergency buttons Hub" },
        { id: "12-10", description: "2.7.3.4 Warning sounder & lamp Hub" },
        { id: "12-11", description: "6.5.2.7.8-5.2.7.9 Visual/Audio axial" },
        { id: "12-12", description: "4.5.2.7.10 Lubricate the pitch encoder" },
        { id: "12-13", description: "4.5.2.2-5.2.5 Blades External" },
        { id: "12-14", description: "4.5.2.7.5 Pre-tension pitch suspension" },
        { id: "12-15", description: "4.5.1.5 Examine grease hoses & connecting parts" },
        { id: "12-16", description: "4.5.5.2.7.11 Automatic blade lock" },
        { id: "12-17", description: "4.5.2.7.2 Accumulator pressure" },
        { id: "12-18", description: "5.2.7.3-4 Check all bolts pitch manifold and accumulator support" },
        { id: "12-19", description: "5.1.1.2-4 Check every 10 bolt hub cover" }
      ]
    },
    {
      id: "step-13",
      title: "Crane down the material\n14.5.4 LDST\n14.5.5 Check ladders and platforms\n3.5.4.3-5.4.4 Hatch/Swim assembly\n14.5.6 Visual check of the platform hanger assembly\n14.5.7 Check Tower top senction",
      duration: "150m + (4Y)15m",
      durationMinutes: 150,
      color: "#2196F3",
      colorCode: "T2",
      technician: "T2",
      position: { x: 6, y: -2 },
      tasks: [
        { id: "13-1", description: "Crane down the material" },
        { id: "13-2", description: "14.5.4 LDST" },
        { id: "13-3", description: "14.5.5 Check ladders and platforms" },
        { id: "13-4", description: "3.5.4.3-5.4.4 Hatch/Swim assembly" },
        { id: "13-5", description: "14.5.6 Visual check of the platform hanger assembly" },
        { id: "13-6", description: "14.5.7 Check Tower top senction" }
      ]
    },
    {
      id: "step-14",
      title: "2.7.1.1 Emergency buttons\n14.5.13 1B and UPS control panel ++112\n14.5.13.3-4 Replace UPS batteries\nFinal cleaning\n15. Finish work\nReport",
      duration: "90m + (6V)120m",
      durationMinutes: 90,
      color: "#795548",
      colorCode: "both",
      technician: "both",
      position: { x: 7, y: -1 },
      tasks: [
        { id: "14-1", description: "2.7.1.1 Emergency buttons" },
        { id: "14-2", description: "14.5.13 1B and UPS control panel ++112" },
        { id: "14-3", description: "14.5.13.3-4 Replace UPS batteries" },
        { id: "14-4", description: "Final cleaning" },
        { id: "14-5", description: "15. Finish work" },
        { id: "14-6", description: "Report" }
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
