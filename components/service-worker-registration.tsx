"use client"

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, Sparkles, Download } from 'lucide-react';

export function ServiceWorkerRegistration() {
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Show update toast instead of confirm dialog
                  setWaitingWorker(newWorker);
                  setShowUpdateToast(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });

      // Handle service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);

      // Check if app is already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        // App is already installed, don't show prompt
        return;
      }

      // Check if user has dismissed the prompt before (localStorage)
      const installPromptDismissed = localStorage.getItem('pwa-install-prompt-dismissed');
      const dismissedAt = installPromptDismissed ? parseInt(installPromptDismissed) : 0;
      const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);

      // Show prompt if never dismissed or dismissed more than 7 days ago
      if (!installPromptDismissed || daysSinceDismissed > 7) {
        // Wait 30 seconds before showing the prompt (don't be too aggressive)
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 30000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdateToast(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdateToast(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleInstallDismiss = () => {
    // Remember that user dismissed the prompt
    localStorage.setItem('pwa-install-prompt-dismissed', Date.now().toString());
    setShowInstallPrompt(false);
  };

  return (
    <>
      {/* Update Toast */}
      {showUpdateToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-2xl p-4 max-w-sm border border-blue-400">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-1">
                  Ny version tillgänglig!
                </p>
                <p className="text-xs text-blue-100 mb-3">
                  Uppdatera nu för att få de senaste funktionerna och förbättringarna.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdate}
                    size="sm"
                    className="bg-white text-blue-600 hover:bg-blue-50 h-8 px-3"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Uppdatera nu
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 h-8 px-3"
                  >
                    Senare
                  </Button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
                aria-label="Stäng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install Prompt - Only for Chrome/Edge on Android/Desktop */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-2xl p-4 max-w-sm border border-green-400">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Download className="h-6 w-6 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-1">
                  Installera HRIS
                </p>
                <p className="text-xs text-green-100 mb-3">
                  Installera appen för snabbare åtkomst och offline-funktionalitet. Perfekt för vindkraftverk utan täckning!
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleInstallClick}
                    size="sm"
                    className="bg-white text-green-600 hover:bg-green-50 h-8 px-3"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Installera
                  </Button>
                  <Button
                    onClick={handleInstallDismiss}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 h-8 px-3"
                  >
                    Nej tack
                  </Button>
                </div>
              </div>
              <button
                onClick={handleInstallDismiss}
                className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
                aria-label="Stäng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
