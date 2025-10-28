// Technician Database
export interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  initials: string; // 5 characters: positions 0,2 from first + first 3 from last
  email?: string;
  phone?: string;
  active?: boolean;
  isActive?: boolean; // Alternative field name for API compatibility
  vestas_level?: string;
  competency_level?: string;
  team?: string;
}

// Generate initials from name (positions 0,2 from first + first 3 from last)
// Example: "Johan Andersson" => "JHAND" (J + h + AND)
function generateInitials(firstName: string, lastName: string): string {
  const firstPart = firstName.length >= 3 ?
    (firstName.charAt(0) + firstName.charAt(2)).toUpperCase() :
    (firstName.charAt(0) + (firstName.charAt(1) || 'X')).toUpperCase();
  const lastPart = lastName.substring(0, 3).toUpperCase();
  return firstPart + lastPart;
}

// Mock technicians data - replace with actual database later
export const TECHNICIANS: Technician[] = [
  {
    id: "tech-001",
    firstName: "Johan",
    lastName: "Andersson",
    initials: generateInitials("Johan", "Andersson"), // JHAND
    email: "johan.andersson@example.com",
    active: true
  },
  {
    id: "tech-002",
    firstName: "Maria",
    lastName: "Svensson",
    initials: generateInitials("Maria", "Svensson"), // MASVE
    email: "maria.svensson@example.com",
    active: true
  },
  {
    id: "tech-003",
    firstName: "Erik",
    lastName: "Karlsson",
    initials: generateInitials("Erik", "Karlsson"), // ERKAR
    email: "erik.karlsson@example.com",
    active: true
  },
  {
    id: "tech-004",
    firstName: "Anna",
    lastName: "Nilsson",
    initials: generateInitials("Anna", "Nilsson"), // ANNIL
    email: "anna.nilsson@example.com",
    active: true
  },
  {
    id: "tech-005",
    firstName: "Peter",
    lastName: "Johansson",
    initials: generateInitials("Peter", "Johansson"), // PTJOH
    email: "peter.johansson@example.com",
    active: true
  },
  {
    id: "tech-006",
    firstName: "Linda",
    lastName: "Berg",
    initials: generateInitials("Linda", "Berg"), // LIBER
    email: "linda.berg@example.com",
    active: true
  },
  {
    id: "tech-007",
    firstName: "Stefan",
    lastName: "Eriksson",
    initials: generateInitials("Stefan", "Eriksson"), // STERI
    email: "stefan.eriksson@example.com",
    active: true
  },
  {
    id: "tech-008",
    firstName: "Karin",
    lastName: "Larsson",
    initials: generateInitials("Karin", "Larsson"), // KARLAR
    email: "karin.larsson@example.com",
    active: true
  }
];

// Helper functions
export function getTechnicianById(id: string): Technician | undefined {
  return TECHNICIANS.find(tech => tech.id === id);
}

export function getActiveTechnicians(): Technician[] {
  return TECHNICIANS.filter(tech => tech.active);
}

export function getTechnicianByInitials(initials: string): Technician | undefined {
  return TECHNICIANS.find(tech => tech.initials === initials);
}

// LocalStorage keys for selected technicians
export const STORAGE_KEYS = {
  T1_SELECTION: 'flowchart-technician-t1',
  T2_SELECTION: 'flowchart-technician-t2',
  COMPLETED_FLOWCHARTS: 'completed-flowcharts'
};

// Get selected technicians from localStorage
export function getSelectedTechnicians(): { t1: Technician | null, t2: Technician | null } {
  try {
    const t1Data = localStorage.getItem(STORAGE_KEYS.T1_SELECTION);
    const t2Data = localStorage.getItem(STORAGE_KEYS.T2_SELECTION);

    let t1: Technician | null = null;
    let t2: Technician | null = null;

    // Try to parse as JSON object first (new format)
    if (t1Data) {
      try {
        const parsed = JSON.parse(t1Data);
        // Ensure initials field exists (could be missing if saved from older code)
        t1 = {
          ...parsed,
          initials: parsed.initials || generateInitials(parsed.firstName || '', parsed.lastName || '')
        };
      } catch {
        // If parsing fails, treat as ID (old format) and look up in TECHNICIANS
        t1 = getTechnicianById(t1Data) || null;
      }
    }

    if (t2Data) {
      try {
        const parsed = JSON.parse(t2Data);
        // Ensure initials field exists (could be missing if saved from older code)
        t2 = {
          ...parsed,
          initials: parsed.initials || generateInitials(parsed.firstName || '', parsed.lastName || '')
        };
      } catch {
        // If parsing fails, treat as ID (old format) and look up in TECHNICIANS
        t2 = getTechnicianById(t2Data) || null;
      }
    }

    return { t1, t2 };
  } catch (e) {
    console.error('Failed to load technician selections:', e);
    return { t1: null, t2: null };
  }
}

// Save technician selection to localStorage
export function saveSelectedTechnician(role: 'T1' | 'T2', technician: Technician) {
  const key = role === 'T1' ? STORAGE_KEYS.T1_SELECTION : STORAGE_KEYS.T2_SELECTION;
  localStorage.setItem(key, JSON.stringify(technician));
}
