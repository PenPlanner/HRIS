// Technician Vehicle Management
// Stores vehicle assignments for technicians in localStorage

export interface TechnicianVehicle {
  technicianId: string;
  vehicleRegistration: string; // License plate / Registration number
  vehicleMake: string; // e.g., "Volkswagen"
  vehicleModel: string; // e.g., "Transporter"
  vehicleYear: number; // e.g., 2021
  vehicleType: 'Van' | 'Truck' | 'Car'; // Vehicle category
  assignedDate: string; // ISO date when vehicle was assigned
  mileage?: number; // Current mileage in km
  nextServiceDate?: string; // ISO date for next service
  nextServiceMileage?: number; // Mileage for next service
  fuelCard?: string; // Fuel card number
  notes?: string; // Additional notes about the vehicle
}

const STORAGE_KEY = 'technician_vehicles';

// Get all vehicles from localStorage
export function getAllVehicles(): TechnicianVehicle[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as TechnicianVehicle[];
  } catch (error) {
    console.error('Failed to load vehicles:', error);
    return [];
  }
}

// Get vehicle for specific technician
export function getTechnicianVehicle(technicianId: string): TechnicianVehicle | null {
  const vehicles = getAllVehicles();
  return vehicles.find(v => v.technicianId === technicianId) || null;
}

// Assign vehicle to technician
export function assignVehicle(vehicle: TechnicianVehicle): void {
  if (typeof window === 'undefined') return;

  try {
    const vehicles = getAllVehicles();

    // Remove existing vehicle for this technician if any
    const filtered = vehicles.filter(v => v.technicianId !== vehicle.technicianId);

    // Add new vehicle assignment
    filtered.push(vehicle);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to assign vehicle:', error);
  }
}

// Remove vehicle assignment
export function removeVehicle(technicianId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const vehicles = getAllVehicles();
    const filtered = vehicles.filter(v => v.technicianId !== technicianId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove vehicle:', error);
  }
}

// Update vehicle information
export function updateVehicle(technicianId: string, updates: Partial<Omit<TechnicianVehicle, 'technicianId'>>): void {
  if (typeof window === 'undefined') return;

  try {
    const vehicle = getTechnicianVehicle(technicianId);
    if (!vehicle) {
      console.error('No vehicle found for technician:', technicianId);
      return;
    }

    const updatedVehicle = { ...vehicle, ...updates };
    assignVehicle(updatedVehicle);
  } catch (error) {
    console.error('Failed to update vehicle:', error);
  }
}

// Clear all vehicles (for testing)
export function clearAllVehicles(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
