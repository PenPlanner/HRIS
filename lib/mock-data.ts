// Mock data for all teams with realistic distributions
// ~25 technicians per team, 2 technicians per van (with some variations)

export type VestasLevel = 'D' | 'C' | 'B' | 'A' | 'Field Trainer';

export type Team = {
  id: string;
  name: string;
  color: string;
  organization: string;
};

export type Technician = {
  id: string;
  first_name: string;
  last_name: string;
  initials: string;
  team_id: string;
  team_name: string;
  team_color: string;
  vestas_level: VestasLevel;
  competency_level: number; // 1-5
  email: string;
  phone?: string;
};

export type Vehicle = {
  id: string;
  registration: string;
  team_id: string;
  team_name: string;
  team_color: string;
  make: string;
  model: string;
  year: number;
  assigned_technicians: string[]; // initials
};

export const TEAMS: Team[] = [
  { id: "1", name: "Travel S", color: "#06b6d4", organization: "Travel" },
  { id: "2", name: "Travel U", color: "#0ea5e9", organization: "Travel" },
  { id: "3", name: "South 1", color: "#ef4444", organization: "South" },
  { id: "4", name: "South 2", color: "#f97316", organization: "South" },
  { id: "5", name: "North 1", color: "#a855f7", organization: "North" },
  { id: "6", name: "North 2", color: "#d946ef", organization: "North" },
];

// Helper function to generate realistic Vestas level distribution
const getRandomVestasLevel = (): VestasLevel => {
  const rand = Math.random();
  if (rand < 0.05) return 'Field Trainer'; // 5% Field Trainers
  if (rand < 0.15) return 'A'; // 10% A-Level
  if (rand < 0.50) return 'B'; // 35% B-Level (most common)
  if (rand < 0.85) return 'C'; // 35% C-Level (most common)
  return 'D'; // 15% D-Level
};

// Generate competency level based on Vestas level
const getCompetencyLevel = (vestasLevel: VestasLevel): number => {
  if (vestasLevel === 'Field Trainer') return 5;
  if (vestasLevel === 'A') return Math.random() < 0.7 ? 5 : 4;
  if (vestasLevel === 'B') return Math.random() < 0.5 ? 4 : 3;
  if (vestasLevel === 'C') return Math.random() < 0.6 ? 3 : 2;
  return Math.random() < 0.5 ? 2 : 1;
};

// Swedish names for realistic data
const firstNames = [
  "Anders", "Björn", "Carl", "David", "Erik", "Fredrik", "Gustav", "Henrik",
  "Johan", "Karl", "Lars", "Magnus", "Niklas", "Oscar", "Peter", "Robert",
  "Stefan", "Thomas", "Viktor", "Wilhelm", "Alexander", "Benjamin", "Christian",
  "Daniel", "Emil", "Felix", "Gabriel", "Hugo", "Isak", "Jakob", "Kevin",
  "Lucas", "Martin", "Noah", "Oliver", "Pontus", "Rasmus", "Sebastian", "Tobias"
];

const lastNames = [
  "Andersson", "Bengtsson", "Carlsson", "Danielsson", "Eriksson", "Fredriksson",
  "Gustafsson", "Hansson", "Johansson", "Karlsson", "Larsson", "Magnusson",
  "Nilsson", "Olsson", "Persson", "Robertsson", "Svensson", "Thomasson",
  "Vikström", "Westberg", "Åberg", "Öberg", "Lindström", "Bergström", "Sjöberg",
  "Lundberg", "Pettersson", "Jonsson", "Jansson", "Holmberg", "Forsberg", "Axelsson"
];

// Generate initials from name (positions 1,3 from first + first 3 from last)
const generateInitials = (firstName: string, lastName: string): string => {
  const firstPart = firstName.length >= 3 ?
    firstName.charAt(0) + firstName.charAt(2) :
    firstName.charAt(0) + (firstName.charAt(1) || 'X');
  const lastPart = lastName.substring(0, 3).toUpperCase();
  return (firstPart + lastPart).toUpperCase();
};

// Generate technicians for a team
const generateTechniciansForTeam = (team: Team, startId: number, count: number = 25): Technician[] => {
  const technicians: Technician[] = [];
  const usedInitials = new Set<string>();

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    let initials = generateInitials(firstName, lastName);

    // Ensure unique initials - with safety limit to prevent infinite loops
    let counter = 1;
    while (usedInitials.has(initials) && counter < 100) {
      initials = generateInitials(firstName + counter, lastName);
      counter++;
    }
    // If still not unique after 100 attempts, add random number
    if (usedInitials.has(initials)) {
      initials = initials + Math.floor(Math.random() * 1000);
    }
    usedInitials.add(initials);

    const vestasLevel = getRandomVestasLevel();
    const competencyLevel = getCompetencyLevel(vestasLevel);

    technicians.push({
      id: (startId + i).toString(),
      first_name: firstName,
      last_name: lastName,
      initials,
      team_id: team.id,
      team_name: team.name,
      team_color: team.color,
      vestas_level: vestasLevel,
      competency_level: competencyLevel,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@vestas.com`,
      phone: `+46 70 ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`,
    });
  }

  // Ensure at least 1-2 Field Trainers per team
  const fieldTrainers = technicians.filter(t => t.vestas_level === 'Field Trainer').length;
  if (fieldTrainers === 0) {
    // Convert a high-level technician to Field Trainer
    const highLevel = technicians.find(t => t.vestas_level === 'A' && t.competency_level === 5);
    if (highLevel) {
      highLevel.vestas_level = 'Field Trainer';
    }
  }

  return technicians;
};

// Vehicle makes and models
const vehicleTypes = [
  { make: "Mercedes", model: "Sprinter" },
  { make: "Volkswagen", model: "Crafter" },
  { make: "Ford", model: "Transit" },
  { make: "Renault", model: "Master" },
  { make: "Iveco", model: "Daily" },
  { make: "Fiat", model: "Ducato" },
];

// Generate vehicles for a team
const generateVehiclesForTeam = (
  team: Team,
  technicians: Technician[],
  startId: number,
  vehicleRatio: number = 0.5 // 0.5 = 2 technicians per van (normal)
): Vehicle[] => {
  const techCount = technicians.length;
  const idealVehicleCount = Math.round(techCount * vehicleRatio);
  const vehicles: Vehicle[] = [];
  const allInitials = technicians.map(t => t.initials);

  for (let i = 0; i < idealVehicleCount; i++) {
    const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    const year = 2019 + Math.floor(Math.random() * 6); // 2019-2024

    // Generate Swedish-style registration (ABC123 format)
    const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                   String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                   String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const numbers = Math.floor(100 + Math.random() * 900);
    const registration = `${letters}${numbers}`;

    // Assign 1-3 technicians per vehicle (mostly 2)
    const assignCount = Math.random() < 0.7 ? 2 : (Math.random() < 0.8 ? 3 : 1);
    const startIdx = i * 2;
    const assigned = allInitials.slice(startIdx, startIdx + assignCount);

    vehicles.push({
      id: (startId + i).toString(),
      registration,
      team_id: team.id,
      team_name: team.name,
      team_color: team.color,
      make: vehicleType.make,
      model: vehicleType.model,
      year,
      assigned_technicians: assigned,
    });
  }

  return vehicles;
};

// Generate all data
let techIdCounter = 1;
let vehicleIdCounter = 1;

export const ALL_TECHNICIANS: Technician[] = [];
export const ALL_VEHICLES: Vehicle[] = [];

// Travel S - 24 technicians, 12 vans (perfect ratio)
const travelSTechs = generateTechniciansForTeam(TEAMS[0], techIdCounter, 24);
ALL_TECHNICIANS.push(...travelSTechs);
techIdCounter += 24;
ALL_VEHICLES.push(...generateVehiclesForTeam(TEAMS[0], travelSTechs, vehicleIdCounter, 0.5));
vehicleIdCounter += 12;

// Travel U - 26 technicians, 11 vans (slightly under)
const travelUTechs = generateTechniciansForTeam(TEAMS[1], techIdCounter, 26);
ALL_TECHNICIANS.push(...travelUTechs);
techIdCounter += 26;
ALL_VEHICLES.push(...generateVehiclesForTeam(TEAMS[1], travelUTechs, vehicleIdCounter, 0.42));
vehicleIdCounter += 11;

// South 1 - 25 technicians, 8 vans (significantly under - need to borrow)
const south1Techs = generateTechniciansForTeam(TEAMS[2], techIdCounter, 25);
ALL_TECHNICIANS.push(...south1Techs);
techIdCounter += 25;
ALL_VEHICLES.push(...generateVehiclesForTeam(TEAMS[2], south1Techs, vehicleIdCounter, 0.32));
vehicleIdCounter += 8;

// South 2 - 23 technicians, 14 vans (too many vehicles)
const south2Techs = generateTechniciansForTeam(TEAMS[3], techIdCounter, 23);
ALL_TECHNICIANS.push(...south2Techs);
techIdCounter += 23;
ALL_VEHICLES.push(...generateVehiclesForTeam(TEAMS[3], south2Techs, vehicleIdCounter, 0.61));
vehicleIdCounter += 14;

// North 1 - 27 technicians, 13 vans (close to perfect)
const north1Techs = generateTechniciansForTeam(TEAMS[4], techIdCounter, 27);
ALL_TECHNICIANS.push(...north1Techs);
techIdCounter += 27;
ALL_VEHICLES.push(...generateVehiclesForTeam(TEAMS[4], north1Techs, vehicleIdCounter, 0.48));
vehicleIdCounter += 13;

// North 2 - 22 technicians, 9 vans (slightly under)
const north2Techs = generateTechniciansForTeam(TEAMS[5], techIdCounter, 22);
ALL_TECHNICIANS.push(...north2Techs);
techIdCounter += 22;
ALL_VEHICLES.push(...generateVehiclesForTeam(TEAMS[5], north2Techs, vehicleIdCounter, 0.41));
vehicleIdCounter += 9;

// Helper functions
export const getTechniciansByTeam = (teamId: string): Technician[] => {
  return ALL_TECHNICIANS.filter(t => t.team_id === teamId);
};

export const getVehiclesByTeam = (teamId: string): Vehicle[] => {
  return ALL_VEHICLES.filter(v => v.team_id === teamId);
};

export const getTeamById = (teamId: string): Team | undefined => {
  return TEAMS.find(t => t.id === teamId);
};

// Calculate vehicle balance
export const calculateVehicleBalance = (teamId: string): {
  technicianCount: number;
  vehicleCount: number;
  idealVehicleCount: number;
  balance: number; // positive = too many vehicles, negative = too few
  status: 'perfect' | 'good' | 'warning' | 'critical';
} => {
  const technicians = getTechniciansByTeam(teamId);
  const vehicles = getVehiclesByTeam(teamId);
  const techCount = technicians.length;
  const vehicleCount = vehicles.length;
  const idealCount = Math.round(techCount / 2); // 2 technicians per van
  const balance = vehicleCount - idealCount;

  let status: 'perfect' | 'good' | 'warning' | 'critical' = 'perfect';
  if (Math.abs(balance) === 0) status = 'perfect';
  else if (Math.abs(balance) <= 1) status = 'good';
  else if (Math.abs(balance) <= 3) status = 'warning';
  else status = 'critical';

  return {
    technicianCount: techCount,
    vehicleCount,
    idealVehicleCount: idealCount,
    balance,
    status
  };
};

// Get Vestas level distribution
export const getVestasLevelDistribution = (teamId: string) => {
  const technicians = getTechniciansByTeam(teamId);
  const distribution = {
    'D': 0,
    'C': 0,
    'B': 0,
    'A': 0,
    'Field Trainer': 0,
  };

  technicians.forEach(t => {
    distribution[t.vestas_level]++;
  });

  return distribution;
};

// Get competency level distribution
export const getCompetencyLevelDistribution = (teamId: string) => {
  const technicians = getTechniciansByTeam(teamId);
  const distribution = [0, 0, 0, 0, 0]; // Level 1-5

  technicians.forEach(t => {
    distribution[t.competency_level - 1]++;
  });

  return distribution.map((count, index) => ({
    level: `Level ${index + 1}`,
    count,
    fill: ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981'][index]
  }));
};

// Get average competency level
export const getAverageCompetencyLevel = (teamId: string): number => {
  const technicians = getTechniciansByTeam(teamId);
  if (technicians.length === 0) return 0;

  const sum = technicians.reduce((acc, t) => acc + t.competency_level, 0);
  return Math.round((sum / technicians.length) * 10) / 10;
};

// Get recent assessments (simulated)
export const getRecentAssessments = (teamId: string, limit: number = 3) => {
  const technicians = getTechniciansByTeam(teamId);
  // Sort by competency level (simulating recent updates for high performers)
  return technicians
    .sort((a, b) => b.competency_level - a.competency_level)
    .slice(0, limit)
    .map((t, index) => ({
      id: t.id,
      name: `${t.first_name} ${t.last_name}`,
      team: t.team_name,
      level: t.competency_level,
      date: new Date(Date.now() - index * 86400000).toISOString().split('T')[0], // Last 3 days
      teamColor: t.team_color,
    }));
};
