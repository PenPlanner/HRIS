/**
 * PDF Metadata
 * Metadata for SII documents
 */

export interface PDFMetadata {
  documentNumber: string;
  version: string;
  classification: string;
  type: string;
  date: string;
  title: string;
}

/**
 * Hardcoded metadata for SII documents
 * Based on document structure and known information
 */
const SII_METADATA: Record<number, PDFMetadata> = {
  1: {
    documentNumber: "0093-1903",
    version: "V11",
    classification: "CONFIDENTIAL",
    type: "T09",
    date: "2025-09-30",
    title: "Prepare for service"
  },
  2: {
    documentNumber: "0093-1903",
    version: "V11",
    classification: "CONFIDENTIAL",
    type: "T09",
    date: "2025-09-30",
    title: "Functional safety test"
  },
  3: {
    documentNumber: "0093-1903",
    version: "V11",
    classification: "CONFIDENTIAL",
    type: "T09",
    date: "2025-09-30",
    title: "Safety equipment"
  },
  4: {
    documentNumber: "0093-1903",
    version: "V11",
    classification: "CONFIDENTIAL",
    type: "T09",
    date: "2025-09-30",
    title: "Hub and blades"
  },
  5: {
    documentNumber: "0093-1903",
    version: "V11",
    classification: "CONFIDENTIAL",
    type: "T09",
    date: "2025-09-30",
    title: "Hydraulic systems"
  },
  6: {
    documentNumber: "0093-1903",
    version: "V11",
    classification: "CONFIDENTIAL",
    type: "T09",
    date: "2025-09-30",
    title: "Gearbox and gear oil system"
  },
  7: {
    documentNumber: "0093-1903",
    version: "V11",
    classification: "CONFIDENTIAL",
    type: "T09",
    date: "2025-09-30",
    title: "Generator"
  },
  8: {
    documentNumber: "0093-1903",
    version: "V11",
    classification: "CONFIDENTIAL",
    type: "T09",
    date: "2025-09-30",
    title: "Cooling and conditioning"
  },
  9: {
    documentNumber: "0093-1903",
    version: "V11",
    classification: "CONFIDENTIAL",
    type: "T09",
    date: "2025-09-30",
    title: "Nacelle"
  },
  10: {
    documentNumber: "0093-1903",
    version: "V11",
    classification: "CONFIDENTIAL",
    type: "T09",
    date: "2025-09-30",
    title: "Yaw system"
  },
  11: {
    documentNumber: "0093-1903",
    version: "V11",
    classification: "CONFIDENTIAL",
    type: "T09",
    date: "2025-09-30",
    title: "Service crane"
  },
  12: {
    documentNumber: "0093-1903",
    version: "V11",
    classification: "CONFIDENTIAL",
    type: "T09",
    date: "2025-09-30",
    title: "High voltage"
  },
  13: {
    documentNumber: "0093-1903",
    version: "V11",
    classification: "CONFIDENTIAL",
    type: "T09",
    date: "2025-09-30",
    title: "Service lift and climb assistance"
  },
  14: {
    documentNumber: "0093-1903",
    version: "V11",
    classification: "CONFIDENTIAL",
    type: "T09",
    date: "2025-09-30",
    title: "Tower"
  },
  15: {
    documentNumber: "0093-1903",
    version: "V11",
    classification: "CONFIDENTIAL",
    type: "T09",
    date: "2025-09-30",
    title: "Finish work"
  },
};

/**
 * Gets metadata for an SII document by extracting document number from URL
 */
export async function extractPDFMetadata(pdfUrl: string): Promise<PDFMetadata | null> {
  try {
    // Extract document number from URL pattern: /files/flowchart/sii/11. SII-...
    const match = pdfUrl.match(/\/(\d+)\.\s*SII-/);
    if (!match) {
      console.warn(`Could not extract document number from URL: ${pdfUrl}`);
      return null;
    }

    const docNumber = parseInt(match[1], 10);
    return SII_METADATA[docNumber] || null;
  } catch (error) {
    console.error(`Failed to get metadata for PDF: ${pdfUrl}`, error);
    return null;
  }
}

/**
 * Batch extract metadata from multiple PDFs
 */
export async function extractMultiplePDFMetadata(
  pdfUrls: string[]
): Promise<Map<string, PDFMetadata>> {
  const results = new Map<string, PDFMetadata>();

  await Promise.all(
    pdfUrls.map(async (url) => {
      const metadata = await extractPDFMetadata(url);
      if (metadata) {
        results.set(url, metadata);
      }
    })
  );

  return results;
}

/**
 * Format metadata for display
 */
export function formatPDFMetadata(metadata: PDFMetadata): string {
  return `${metadata.documentNumber} ${metadata.version} · ${metadata.type} · ${metadata.date}`;
}
