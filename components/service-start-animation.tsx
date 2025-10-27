"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sparkles, Zap, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceStartAnimationProps {
  open: boolean;
  onComplete: () => void;
  serviceType: string;
  wtgNumber: string;
  t1Name: string;
  t2Name: string;
}

interface Step {
  id: number;
  text: string;
  duration: number;
  completed: boolean;
}

const LOADING_STEPS = [
  { id: 1, text: "📋 Loading service program configuration...", duration: 800 },
  { id: 2, text: "👥 Assigning technician roles and responsibilities...", duration: 700 },
  { id: 3, text: "📊 Building flowchart structure and task sequences...", duration: 900 },
  { id: 4, text: "✅ Verifying all steps and documentation links...", duration: 800 },
  { id: 5, text: "🚀 Service program ready - Starting now!", duration: 600 },
];

export function ServiceStartAnimation({
  open,
  onComplete,
  serviceType,
  wtgNumber,
  t1Name,
  t2Name
}: ServiceStartAnimationProps) {
  const [steps, setSteps] = useState<Step[]>(
    LOADING_STEPS.map(s => ({ ...s, completed: false }))
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      // Reset when modal closes
      setSteps(LOADING_STEPS.map(s => ({ ...s, completed: false })));
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    let stepIndex = 0;
    let progressInterval: NodeJS.Timeout;
    let stepTimeout: NodeJS.Timeout;

    const runStep = () => {
      if (stepIndex >= LOADING_STEPS.length) {
        // All steps completed
        setTimeout(() => {
          onComplete();
        }, 500);
        return;
      }

      const step = LOADING_STEPS[stepIndex];
      setCurrentStep(stepIndex);

      // Animate progress for this step
      const startProgress = (stepIndex / LOADING_STEPS.length) * 100;
      const endProgress = ((stepIndex + 1) / LOADING_STEPS.length) * 100;
      const progressStep = (endProgress - startProgress) / (step.duration / 50);
      let currentProgress = startProgress;

      progressInterval = setInterval(() => {
        currentProgress += progressStep;
        if (currentProgress >= endProgress) {
          currentProgress = endProgress;
          clearInterval(progressInterval);
        }
        setProgress(currentProgress);
      }, 50);

      // Mark step as completed after duration
      stepTimeout = setTimeout(() => {
        setSteps(prev => prev.map((s, i) =>
          i === stepIndex ? { ...s, completed: true } : s
        ));
        stepIndex++;
        runStep();
      }, step.duration);
    };

    runStep();

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
    };
  }, [open, onComplete]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="space-y-6">
          {/* Header with sparkles */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-3 animate-pulse">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Preparing Your Service
            </h2>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-mono">
                <span className="font-bold">{serviceType} Service</span> • WTG {wtgNumber}
              </p>
              <p className="text-xs">
                {t1Name} & {t2Name}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-mono font-bold text-purple-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-300 ease-out animate-gradient-x"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps list */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-2 scrollbar-thin">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-all duration-300",
                  index === currentStep && "bg-purple-50 dark:bg-purple-950 border-2 border-purple-300 dark:border-purple-700 scale-105",
                  index < currentStep && "opacity-60",
                  index > currentStep && "opacity-30"
                )}
              >
                <div className="mt-0.5">
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 animate-bounce-once" />
                  ) : index === currentStep ? (
                    <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-sm leading-relaxed",
                    index === currentStep && "font-semibold text-purple-900 dark:text-purple-100",
                    step.completed && "text-gray-600 dark:text-gray-400",
                    index > currentStep && "text-gray-400 dark:text-gray-600"
                  )}>
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>HRIS - Professional Service Management System</span>
            </div>
          </div>
        </div>
      </DialogContent>

      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes bounce-once {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 2s ease infinite;
        }

        .animate-bounce-once {
          animation: bounce-once 0.5s ease-in-out;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #9333ea;
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #7e22ce;
        }
      `}</style>
    </Dialog>
  );
}
