"use client"

import { useState, useEffect } from "react";
import { Download, X, CloudDownload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show our custom install prompt
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or if dismissed recently
  if (isInstalled || !showPrompt) return null;

  const dismissedTime = localStorage.getItem('pwa-install-dismissed');
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
    return null; // Dismissed within last 7 days
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="pt-6 pb-4 px-4">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <CloudDownload className="h-6 w-6 text-blue-600" />
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1">Install HRIS App</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Install this app for offline access and a better experience. Works without internet!
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                  <span>Full offline functionality</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                  <span>Auto-sync when online</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                  <span>Faster load times</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  size="sm"
                  className="flex-1 h-9 text-xs"
                >
                  {isInstalling ? (
                    <>
                      <CloudDownload className="h-3.5 w-3.5 mr-1.5 animate-bounce" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Install App
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs"
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
