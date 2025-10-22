// Vestas Training Courses Database
// Based on Vestas Electrical Training Matrix

export type CourseCategory =
  | "Electrical Safety"
  | "High Voltage"
  | "Mechanical"
  | "Turbine Specific"
  | "Management"
  | "Nordic Specific";

export type Course = {
  id: string;
  code: string;
  name: string;
  category: CourseCategory;
  duration_days: number;
  provider: string;
  prerequisites?: string[];
  description: string;
  max_participants?: number;
};

export const ALL_COURSES: Course[] = [
  // Electrical Safety Courses
  {
    id: "esa01",
    code: "ESA01",
    name: "Electrical Safety Awareness",
    category: "Electrical Safety",
    duration_days: 1,
    provider: "Vestas",
    description: "Basic electrical safety awareness for all personnel",
    max_participants: 20,
  },
  {
    id: "esa05",
    code: "ESA05",
    name: "Electrical Safety",
    category: "Electrical Safety",
    duration_days: 5,
    provider: "Vestas",
    description: "Comprehensive electrical safety training",
    max_participants: 16,
  },
  {
    id: "en50110",
    code: "EN50110",
    name: "EN50110 Training",
    category: "Electrical Safety",
    duration_days: 3,
    provider: "External",
    description: "European standard for electrical safety operations",
    max_participants: 12,
  },

  // High Voltage Courses
  {
    id: "hv-safety",
    code: "HV-SAFETY",
    name: "HV Safety",
    category: "High Voltage",
    duration_days: 5,
    provider: "Vestas",
    prerequisites: ["esa05"],
    description: "High voltage electrical safety and operations",
    max_participants: 12,
  },
  {
    id: "hv-switching",
    code: "HV-SWITCH",
    name: "HV Switching Operations",
    category: "High Voltage",
    duration_days: 3,
    provider: "Vestas",
    prerequisites: ["hv-safety"],
    description: "High voltage switching procedures",
    max_participants: 10,
  },
  {
    id: "add-on-c-hv",
    code: "ADDON-C-HV",
    name: "Add-on C-Level HV",
    category: "High Voltage",
    duration_days: 2,
    provider: "Vestas",
    prerequisites: ["esa05"],
    description: "Additional HV training for C-level technicians",
    max_participants: 12,
  },

  // Mechanical Courses
  {
    id: "mech-safety",
    code: "MECH-SAFE",
    name: "Mechanical Safety",
    category: "Mechanical",
    duration_days: 3,
    provider: "Vestas",
    description: "Mechanical safety procedures and LOTO",
    max_participants: 16,
  },
  {
    id: "torque-tensioning",
    code: "TORQUE",
    name: "Torque & Tensioning",
    category: "Mechanical",
    duration_days: 2,
    provider: "Vestas",
    description: "Proper torque and tensioning procedures",
    max_participants: 12,
  },
  {
    id: "hydraulics",
    code: "HYD-BASIC",
    name: "Hydraulics Basic",
    category: "Mechanical",
    duration_days: 2,
    provider: "Vestas",
    description: "Basic hydraulic systems",
    max_participants: 12,
  },

  // Turbine Specific Courses
  {
    id: "tos-v90",
    code: "TOS-V90",
    name: "Turbine Operation and Service - V90",
    category: "Turbine Specific",
    duration_days: 10,
    provider: "Vestas",
    description: "Complete training for V90 turbines",
    max_participants: 12,
  },
  {
    id: "tos-v117",
    code: "TOS-V117",
    name: "Turbine Operation and Service - V117",
    category: "Turbine Specific",
    duration_days: 10,
    provider: "Vestas",
    description: "Complete training for V117 turbines",
    max_participants: 12,
  },
  {
    id: "tos-enventus",
    code: "TOS-ENV",
    name: "Turbine Operation and Service - EnVentus",
    category: "Turbine Specific",
    duration_days: 10,
    provider: "Vestas",
    description: "Complete training for EnVentus platform",
    max_participants: 12,
  },
  {
    id: "troubleshooting-elec",
    code: "TS-ELEC",
    name: "Electrical Troubleshooting",
    category: "Turbine Specific",
    duration_days: 5,
    provider: "Vestas",
    prerequisites: ["esa05"],
    description: "Advanced electrical troubleshooting",
    max_participants: 10,
  },

  // Management Courses
  {
    id: "pic-training",
    code: "PIC",
    name: "Person in Charge Training",
    category: "Management",
    duration_days: 2,
    provider: "Vestas",
    description: "Leadership and safety management for PiC role",
    max_participants: 16,
  },
  {
    id: "field-trainer",
    code: "FT-CERT",
    name: "Field Trainer Certification",
    category: "Management",
    duration_days: 3,
    provider: "Vestas",
    description: "Certification for field trainer role",
    max_participants: 12,
  },

  // Nordic Specific Courses
  {
    id: "ha-nordic",
    code: "HA-NORDIC",
    name: "Heta Arbeten (Hot Work Permit)",
    category: "Nordic Specific",
    duration_days: 1,
    provider: "External",
    description: "Swedish hot work permit certification",
    max_participants: 20,
  },
  {
    id: "arbetsmiljo",
    code: "WORK-ENV",
    name: "Arbetsmiljö (Work Environment)",
    category: "Nordic Specific",
    duration_days: 1,
    provider: "External",
    description: "Swedish work environment regulations",
    max_participants: 20,
  },
  {
    id: "first-aid",
    code: "FIRST-AID",
    name: "First Aid Certification",
    category: "Nordic Specific",
    duration_days: 2,
    provider: "External",
    description: "First aid and CPR certification",
    max_participants: 16,
  },
  {
    id: "working-height",
    code: "HEIGHT",
    name: "Working at Heights",
    category: "Nordic Specific",
    duration_days: 1,
    provider: "External",
    description: "Safety training for working at heights",
    max_participants: 16,
  },
];

// Helper functions
export const getCourseById = (id: string): Course | undefined => {
  return ALL_COURSES.find((course) => course.id === id);
};

export const getCoursesByCategory = (category: CourseCategory): Course[] => {
  return ALL_COURSES.filter((course) => course.category === category);
};

export const getCourseCodes = (): string[] => {
  return ALL_COURSES.map((course) => course.code);
};
