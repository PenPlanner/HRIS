/**
 * Service Type Color System
 * Ensures consistent colors for service types throughout the application
 */

export const SERVICE_TYPE_COLORS = {
  "All": "#A855F7", // Purple - External/Extra tasks (Ext)
  "1Y": "#000000", // Black - 1 Year Service
  "2Y": "#FF8C00", // Orange - 2 Year Service
  "3Y": "#4CAF50", // Green - 3 Year Service
  "4Y": "#2196F3", // Blue - 4 Year Service
  "5Y": "#F44336", // Red - 5 Year Service
  "6Y": "#795548", // Brown - 6 Year Service
  "7Y": "#FFEB3B", // Yellow - 7 Year Service
  "10Y": "#D4C5A9", // Beige - 10 Year Service
  "12Y": "#000000", // Black - 12 Year Service (same as 1Y)
  "Multi": "#607D8B", // Blue Grey - Multi-year service
  "1M": "#FFC107", // Amber - 1 Month Service
  "default": "#4CAF50", // Green - Default color
} as const;

export type ServiceTypeCode = keyof typeof SERVICE_TYPE_COLORS;

/**
 * Get color for a service type
 */
export function getServiceTypeColor(colorCode: string): string {
  // Extract service type from colorCode (handles cases like "1Y", "2Y", "Multi")
  const match = colorCode.match(/^(\d+[YM]|Multi)/);
  if (!match) return SERVICE_TYPE_COLORS.default;

  const serviceType = match[1] as ServiceTypeCode;
  return SERVICE_TYPE_COLORS[serviceType] || SERVICE_TYPE_COLORS.default;
}

/**
 * Get all unique service types from a flowchart
 */
export function getUniqueServiceTypes(colorCodes: string[]): ServiceTypeCode[] {
  const types = new Set<ServiceTypeCode>();

  colorCodes.forEach(code => {
    const match = code.match(/^(\d+[YM]|Multi)/);
    if (match) {
      types.add(match[1] as ServiceTypeCode);
    }
  });

  return Array.from(types).sort((a, b) => {
    // Sort by number first, then by type
    const aNum = parseInt(a) || 999;
    const bNum = parseInt(b) || 999;
    if (aNum !== bNum) return aNum - bNum;
    return a.localeCompare(b);
  });
}

/**
 * RGB color mappings from PDF text colors to service types
 * These are the typical colors used in PDF flowcharts to indicate service intervals
 */
export const PDF_RGB_TO_SERVICE_TYPE: { [key: string]: ServiceTypeCode } = {
  // Black text = base/1Y service
  "0,0,0": "1Y",

  // Orange = 2Y service
  "255,165,0": "2Y",
  "255,128,0": "2Y",
  "245,124,0": "2Y", // Our standard 2Y color

  // Green = 3Y service
  "0,128,0": "3Y",
  "0,255,0": "3Y",
  "139,195,74": "3Y", // Our standard 3Y color

  // Blue = 4Y service
  "0,0,255": "4Y",
  "33,150,243": "4Y", // Our standard 4Y color

  // Red = 5Y service
  "255,0,0": "5Y",

  // Dark Red/Brown = 6Y service
  "139,0,0": "6Y",
  "128,0,0": "6Y",
  "233,30,99": "6Y", // Our standard 6Y color

  // Yellow = 7Y service
  "255,255,0": "7Y",
  "255,235,59": "7Y",

  // Cyan/Light Blue = 10Y service
  "0,255,255": "10Y",
  "0,188,212": "10Y", // Our standard 10Y color

  // Gray = 12Y service
  "128,128,128": "12Y",
  "169,169,169": "12Y",

  // Purple = 7Y service (alternative)
  "156,39,176": "7Y", // Our standard 7Y color
};

/**
 * Service type legend for display
 */
export const SERVICE_TYPE_LEGEND = [
  { code: "All", label: "Ext", color: SERVICE_TYPE_COLORS["All"] },
  { code: "1Y", label: "1 Year Service", color: SERVICE_TYPE_COLORS["1Y"] },
  { code: "2Y", label: "2 Year Service", color: SERVICE_TYPE_COLORS["2Y"] },
  { code: "3Y", label: "3 Year Service", color: SERVICE_TYPE_COLORS["3Y"] },
  { code: "4Y", label: "4 Year Service", color: SERVICE_TYPE_COLORS["4Y"] },
  { code: "5Y", label: "5 Year Service", color: SERVICE_TYPE_COLORS["5Y"] },
  { code: "6Y", label: "6 Year Service", color: SERVICE_TYPE_COLORS["6Y"] },
  { code: "7Y", label: "7 Year Service", color: SERVICE_TYPE_COLORS["7Y"] },
  { code: "10Y", label: "10 Year Service", color: SERVICE_TYPE_COLORS["10Y"] },
  { code: "Multi", label: "Multi-Year Service", color: SERVICE_TYPE_COLORS["Multi"] },
];

/**
 * Convert RGB values to service type
 * Includes tolerance for slight color variations
 */
export function rgbToServiceType(r: number, g: number, b: number, tolerance: number = 20): ServiceTypeCode | null {
  // Check exact match first
  const exactKey = `${r},${g},${b}`;
  if (PDF_RGB_TO_SERVICE_TYPE[exactKey]) {
    return PDF_RGB_TO_SERVICE_TYPE[exactKey];
  }

  // Check with tolerance
  for (const [rgbKey, serviceType] of Object.entries(PDF_RGB_TO_SERVICE_TYPE)) {
    const [kr, kg, kb] = rgbKey.split(',').map(Number);
    const distance = Math.sqrt(
      Math.pow(r - kr, 2) +
      Math.pow(g - kg, 2) +
      Math.pow(b - kb, 2)
    );

    if (distance <= tolerance) {
      return serviceType;
    }
  }

  // Default to 1Y (base service) if no match
  return "1Y";
}

/**
 * Get all service types that should be included for a given service interval
 * E.g., 4Y service includes 1Y, 2Y, and 4Y tasks
 */
export function getIncludedServiceTypes(serviceType: string): string[] {
  // "All" tasks are always shown regardless of filter
  const included = ["All"];

  const yearMatch = serviceType.match(/(\d+)Y/);
  if (!yearMatch) return ["All", "1Y"];

  const years = parseInt(yearMatch[1]);
  included.push("1Y"); // Always include base service

  // Include all applicable intervals
  if (years >= 2) included.push("2Y");
  if (years >= 3) included.push("3Y");
  if (years >= 4) included.push("4Y");
  if (years >= 5) included.push("5Y");
  if (years >= 6) included.push("6Y");
  if (years >= 7) included.push("7Y");
  if (years >= 10) included.push("10Y");
  if (years >= 12) included.push("12Y");

  return included;
}
