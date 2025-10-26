/**
 * Service Instruction Instruction (SII) Document Management
 *
 * Handles automatic linking between flowchart step references and SII PDF documents.
 * References like "11.5.1 Examine crane" are parsed to link to document 11, section 5.1
 */

export interface SIIReference {
  documentNumber: number;
  section: string;
  description: string;
  fullReference: string; // e.g., "11.5.1"
  documentPath: string;
  documentTitle: string;
}

export interface SIIDocumentInfo {
  documentNumber: number;
  filename: string;
  title: string;
  path: string;
  // Metadata (loaded dynamically from PDF)
  docNumber?: string;
  version?: string;
  classification?: string;
  type?: string;
  date?: string;
}

/**
 * Mapping of SII document numbers to their PDF filenames
 */
export const SII_DOCUMENTS: Record<number, { filename: string; title: string }> = {
  1: { filename: "1. SII-Prepare for service (yearly).pdf", title: "Prepare for service" },
  2: { filename: "2. SII-Functional safety test (yearly).pdf", title: "Functional safety test" },
  3: { filename: "3. SII-Safety equipment (yearly).pdf", title: "Safety equipment" },
  4: { filename: "4. SII-Hub and blades (yearly).pdf", title: "Hub and blades" },
  5: { filename: "5. SII-Hydraulic systems (yearly).pdf", title: "Hydraulic systems" },
  6: { filename: "6. SII-Gearbox and gear oil system (yearly).pdf", title: "Gearbox and gear oil system" },
  7: { filename: "7. SII-Generator (yearly).pdf", title: "Generator" },
  8: { filename: "8. SII-Cooling and conditioning (yearly).pdf", title: "Cooling and conditioning" },
  9: { filename: "9. SII-Nacelle (yearly).pdf", title: "Nacelle" },
  10: { filename: "10. SII-Yaw system (yearly).pdf", title: "Yaw system" },
  11: { filename: "11. SII-Service crane (yearly).pdf", title: "Service crane" },
  12: { filename: "12. SII-High voltage (yearly).pdf", title: "High voltage" },
  13: { filename: "13. SII-Service lift and climb assistance (yearly).pdf", title: "Service lift and climb assistance" },
  14: { filename: "14. SII-Tower (yearly).pdf", title: "Tower" },
  15: { filename: "15. SII-Finish work (yearly).pdf", title: "Finish work" },
};

/**
 * Regular expression to match SII references in task descriptions
 * Matches patterns like:
 * - "11.5.1 Description" (full section reference)
 * - "7. Generator" (document title reference - opens doc without specific page)
 * Captures the first number (document) and optionally the section
 */
const SII_REFERENCE_REGEX = /^(\d{1,2})\.\s*(\d+(?:\.\d+)*(?:[a-z]\d+)?(?:\.\d+-\d+)?(?:-\d+(?:\.\d+)*)?)?/;

/**
 * Extracts SII references from a task description
 *
 * @param description - Task description (e.g., "11.5.1 Examine crane")
 * @returns SIIReference object if a valid reference is found, null otherwise
 *
 * @example
 * parseReference("11.5.1 Examine crane")
 * // Returns: { documentNumber: 11, section: "5.1", description: "Examine crane", ... }
 */
export function parseSIIReference(description: string): SIIReference | null {
  const trimmed = description.trim();
  const match = trimmed.match(SII_REFERENCE_REGEX);

  if (!match) return null;

  const documentNumber = parseInt(match[1], 10);
  const section = match[2] || ""; // Empty string if no section (e.g., "7. Generator")
  const fullReference = section ? `${documentNumber}.${section}` : `${documentNumber}`;

  // Extract description (everything after the reference)
  const descriptionText = trimmed.substring(match[0].length).trim();

  // Validate document number
  if (!SII_DOCUMENTS[documentNumber]) {
    console.warn(`Invalid SII document number: ${documentNumber}`);
    return null;
  }

  const doc = SII_DOCUMENTS[documentNumber];

  return {
    documentNumber,
    section,
    description: descriptionText,
    fullReference,
    documentPath: `/files/flowchart/sii/${doc.filename}`,
    documentTitle: doc.title,
  };
}

/**
 * Extracts all SII references from an array of task descriptions
 *
 * @param tasks - Array of task objects with description property
 * @returns Array of unique SII references found
 */
export function extractSIIReferences(tasks: { description: string }[]): SIIReference[] {
  const references: SIIReference[] = [];
  const seenRefs = new Set<string>();

  for (const task of tasks) {
    const ref = parseSIIReference(task.description);
    if (ref && !seenRefs.has(ref.fullReference)) {
      references.push(ref);
      seenRefs.add(ref.fullReference);
    }
  }

  // Keep original order from tasks - matches flowchart step order
  return references;
}

/**
 * Groups SII references by document number
 * Useful for displaying all sections from the same document together
 *
 * @param references - Array of SII references
 * @returns Map of document number to array of references
 */
export function groupReferencesByDocument(
  references: SIIReference[]
): Map<number, SIIReference[]> {
  const grouped = new Map<number, SIIReference[]>();

  for (const ref of references) {
    const existing = grouped.get(ref.documentNumber) || [];
    existing.push(ref);
    grouped.set(ref.documentNumber, existing);
  }

  return grouped;
}

/**
 * Opens an SII document in a new browser tab
 *
 * @param reference - SII reference to open
 * @param section - Optional section to jump to (if browser supports PDF anchors)
 */
export function openSIIDocument(reference: SIIReference, section?: string): void {
  // Construct URL with optional section anchor
  let url = reference.documentPath;

  // Some PDF viewers support #page=X anchors, but section numbers don't directly map to pages
  // For now, just open the document. Future enhancement: build a page mapping table

  window.open(url, '_blank');
}

/**
 * Get a human-readable summary of an SII reference
 *
 * @param reference - SII reference
 * @returns Formatted string like "Doc 11: Service crane - Section 5.1"
 */
export function formatSIIReference(reference: SIIReference): string {
  return `Doc ${reference.documentNumber}: ${reference.documentTitle} - Section ${reference.section}`;
}

/**
 * Get all SII documents as SIIDocumentInfo objects
 */
export function getAllSIIDocuments(): SIIDocumentInfo[] {
  return Object.entries(SII_DOCUMENTS).map(([num, doc]) => ({
    documentNumber: parseInt(num, 10),
    filename: doc.filename,
    title: doc.title,
    path: `/files/flowchart/sii/${doc.filename}`,
  }));
}
