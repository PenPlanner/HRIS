/**
 * Offline PDF Storage using IndexedDB
 * Allows users to download and cache PDF documents for offline access
 */

const DB_NAME = 'HRIS_Offline_PDFs';
const DB_VERSION = 1;
const STORE_NAME = 'pdfs';

export interface OfflinePDF {
  id: string; // Unique identifier (e.g., "sii-2", "sii-3")
  url: string; // Original URL
  blob: Blob; // PDF blob data
  title: string; // Document title
  downloadedAt: number; // Timestamp
  size: number; // File size in bytes
}

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('url', 'url', { unique: false });
        store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
      }
    };
  });
}

/**
 * Download and cache a PDF
 */
export async function downloadPDFForOffline(
  id: string,
  url: string,
  title: string
): Promise<void> {
  try {
    // Fetch the PDF
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Store in IndexedDB
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const pdfData: OfflinePDF = {
      id,
      url,
      blob,
      title,
      downloadedAt: Date.now(),
      size: blob.size,
    };

    await new Promise((resolve, reject) => {
      const request = store.put(pdfData);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('Error downloading PDF for offline:', error);
    throw error;
  }
}

/**
 * Check if a PDF is available offline
 */
export async function isPDFAvailableOffline(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const result = await new Promise<boolean>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return result;
  } catch (error) {
    console.error('Error checking offline PDF:', error);
    return false;
  }
}

/**
 * Get offline PDF data
 */
export async function getOfflinePDF(id: string): Promise<OfflinePDF | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const result = await new Promise<OfflinePDF | null>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return result;
  } catch (error) {
    console.error('Error getting offline PDF:', error);
    return null;
  }
}

/**
 * Get all offline PDFs
 */
export async function getAllOfflinePDFs(): Promise<OfflinePDF[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const result = await new Promise<OfflinePDF[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return result;
  } catch (error) {
    console.error('Error getting all offline PDFs:', error);
    return [];
  }
}

/**
 * Delete offline PDF
 */
export async function deleteOfflinePDF(id: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('Error deleting offline PDF:', error);
    throw error;
  }
}

/**
 * Clear all offline PDFs
 */
export async function clearAllOfflinePDFs(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('Error clearing offline PDFs:', error);
    throw error;
  }
}

/**
 * Get total storage size used
 */
export async function getOfflineStorageSize(): Promise<number> {
  try {
    const pdfs = await getAllOfflinePDFs();
    return pdfs.reduce((total, pdf) => total + pdf.size, 0);
  } catch (error) {
    console.error('Error calculating storage size:', error);
    return 0;
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
