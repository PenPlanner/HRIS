/**
 * PDF Metadata Extraction
 * Extracts document information from SII PDF first pages
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
 * Extracts metadata from the first page of an SII PDF
 * Parses text like:
 * "Document no.: 0093-1903 V11"
 * "Class: CONFIDENTIAL"
 * "Type: T09"
 * "Date: 2025-09-30"
 */
export async function extractPDFMetadata(pdfUrl: string): Promise<PDFMetadata | null> {
  try {
    // Ensure we're running in browser
    if (typeof window === 'undefined') {
      throw new Error('PDF metadata extraction can only run in browser');
    }

    // Dynamically import pdfjs from react-pdf (client-side only)
    const { pdfjs } = await import('react-pdf');

    // Configure worker if not already configured
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    }

    // Load the PDF
    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    // Get first page
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();

    // Extract text items
    const textItems = textContent.items.map((item: any) => item.str).join(' ');

    // Parse metadata using regex
    const docNumberMatch = textItems.match(/Document no\.?:\s*([\d-]+)\s*V(\d+)/i);
    const classMatch = textItems.match(/Class:\s*(\w+)/i);
    const typeMatch = textItems.match(/Type:\s*(\w+\d*)/i);
    const dateMatch = textItems.match(/Date:\s*([\d-]+)/i);

    // Extract title (usually the largest text on first page)
    const titleMatch = textItems.match(/(\d+)\.\s*SII-([^\n]+)/);

    if (!docNumberMatch) {
      console.warn(`Could not extract document number from PDF: ${pdfUrl}`);
      return null;
    }

    return {
      documentNumber: docNumberMatch[1],
      version: `V${docNumberMatch[2]}`,
      classification: classMatch ? classMatch[1] : 'N/A',
      type: typeMatch ? typeMatch[1] : 'N/A',
      date: dateMatch ? dateMatch[1] : 'N/A',
      title: titleMatch ? titleMatch[2].trim() : 'Unknown',
    };
  } catch (error) {
    console.error(`Failed to extract metadata from PDF: ${pdfUrl}`, error);
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
