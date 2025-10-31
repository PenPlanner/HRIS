"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WifiOff, RefreshCw, Download, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getAllOfflinePDFs } from "@/lib/offline-pdf-storage";

export default function OfflinePage() {
  const router = useRouter();
  const [offlinePDFs, setOfflinePDFs] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    // Load offline PDFs
    getAllOfflinePDFs().then(pdfs => {
      setOfflinePDFs(pdfs || []);
    }).catch(() => {
      setOfflinePDFs([]);
    });

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      router.refresh();
    } else {
      alert('Fortfarande offline. Försök igen när du har internet.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="text-center space-y-6 pb-4">
          <div className="flex justify-center">
            <div className="relative">
              <WifiOff className="h-24 w-24 text-orange-600 animate-pulse" />
              {isOnline && (
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2">
                  <RefreshCw className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
            {isOnline ? 'Ansluter igen...' : 'Du är offline'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-8">
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">
              {isOnline
                ? 'Internet-anslutning återställd! Uppdaterar sidan...'
                : 'Den här sidan är inte tillgänglig offline just nu.'}
            </p>

            {!isOnline && (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-3">
                    Vad du kan göra offline:
                  </p>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 text-left list-none">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400">✓</span>
                      <span>Visa flowcharts som du tidigare besökt</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400">✓</span>
                      <span>Läsa offline-nedladdade PDFs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400">✓</span>
                      <span>Fortsätta arbeta på pågående service-jobb</span>
                    </li>
                  </ul>
                </div>

                {offlinePDFs.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-green-900 dark:text-green-100 font-semibold flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Tillgängliga offline-dokument
                      </p>
                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">
                        {offlinePDFs.length} PDFs
                      </Badge>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {offlinePDFs.slice(0, 5).map((pdf) => (
                        <div
                          key={pdf.id}
                          className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200 bg-white/50 dark:bg-black/20 rounded p-2"
                        >
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{pdf.title}</span>
                        </div>
                      ))}
                      {offlinePDFs.length > 5 && (
                        <p className="text-xs text-green-600 dark:text-green-400 text-center pt-2">
                          + {offlinePDFs.length - 5} fler dokument
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRetry}
              size="lg"
              className="w-full"
              disabled={!isOnline}
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              {isOnline ? 'Uppdatera sidan' : 'Försök igen'}
            </Button>

            <Button
              onClick={() => router.push('/flowcharts')}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <FileText className="h-5 w-5 mr-2" />
              Gå till Flowcharts
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              HRIS fungerar bäst med internet-anslutning.
              <br />
              Ladda ner flowcharts för offline-användning via inställningar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
