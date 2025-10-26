import { useState, useEffect, useCallback } from 'react';
import {
  downloadPDFForOffline,
  isPDFAvailableOffline,
  getOfflinePDF,
  getAllOfflinePDFs,
  deleteOfflinePDF,
  clearAllOfflinePDFs,
  getOfflineStorageSize,
  type OfflinePDF,
} from '@/lib/offline-pdf-storage';

export function useOfflinePDFs() {
  const [offlinePDFs, setOfflinePDFs] = useState<OfflinePDF[]>([]);
  const [storageSize, setStorageSize] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load offline PDFs on mount
  const loadOfflinePDFs = useCallback(async () => {
    try {
      const pdfs = await getAllOfflinePDFs();
      setOfflinePDFs(pdfs);

      const size = await getOfflineStorageSize();
      setStorageSize(size);
    } catch (error) {
      console.error('Error loading offline PDFs:', error);
    }
  }, []);

  useEffect(() => {
    loadOfflinePDFs();
  }, [loadOfflinePDFs]);

  // Download PDF for offline use
  const downloadPDF = useCallback(
    async (id: string, url: string, title: string) => {
      setLoading(true);
      try {
        await downloadPDFForOffline(id, url, title);
        await loadOfflinePDFs(); // Reload list
      } catch (error) {
        console.error('Error downloading PDF:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [loadOfflinePDFs]
  );

  // Delete offline PDF
  const deletePDF = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        await deleteOfflinePDF(id);
        await loadOfflinePDFs(); // Reload list
      } catch (error) {
        console.error('Error deleting PDF:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [loadOfflinePDFs]
  );

  // Clear all offline PDFs
  const clearAll = useCallback(async () => {
    setLoading(true);
    try {
      await clearAllOfflinePDFs();
      await loadOfflinePDFs(); // Reload list
    } catch (error) {
      console.error('Error clearing PDFs:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadOfflinePDFs]);

  // Check if a specific PDF is available offline
  const isAvailable = useCallback(
    (id: string) => {
      return offlinePDFs.some((pdf) => pdf.id === id);
    },
    [offlinePDFs]
  );

  return {
    offlinePDFs,
    storageSize,
    loading,
    downloadPDF,
    deletePDF,
    clearAll,
    isAvailable,
    refresh: loadOfflinePDFs,
  };
}

export function useOfflinePDF(id: string) {
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAvailability = async () => {
      setChecking(true);
      try {
        const available = await isPDFAvailableOffline(id);
        if (mounted) {
          setIsOffline(available);
        }
      } catch (error) {
        console.error('Error checking PDF availability:', error);
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    checkAvailability();

    return () => {
      mounted = false;
    };
  }, [id]);

  return { isOffline, checking };
}
