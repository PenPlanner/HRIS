"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bot,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  MousePointer2,
  FileText,
  CheckSquare,
  Clock,
  StickyNote,
  Eye,
  HelpCircle,
  Book,
  Navigation,
  Link as LinkIcon,
  Download,
  Maximize2,
  Info,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VersionDialog } from "./version-dialog";
import { FloatingIconGroup, defaultFloatingIcons } from "./floating-icon-group";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlightSelector?: string;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  exampleImage?: string;
  preview?: React.ReactNode; // Visual preview/mockup
  highlightElement?: string; // ID/selector of element to highlight
  spotlightPosition?: { top?: string; left?: string; right?: string; bottom?: string };
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to HRIS Flowchart Manager! 🎉',
    description: 'Let me guide you through all the amazing features. This interactive tour will show you how to navigate, manage tasks, log time, and much more!',
    icon: <Sparkles className="h-6 w-6" />,
    position: 'center',
  },
  {
    id: 'navigation',
    title: 'Navigate the Flowchart',
    description: 'Use your mouse to pan around the flowchart. Scroll to zoom in and out. Click and drag to move the canvas.',
    icon: <Navigation className="h-6 w-6" />,
    position: 'center',
    preview: (
      <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-6 border-2 border-dashed border-blue-400">
        {/* Mock flowchart canvas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold">
            <MousePointer2 className="h-4 w-4" />
            <span>Click & drag to pan →</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-white dark:bg-gray-700 rounded shadow-md border-2 border-blue-300" />
            <div className="h-16 bg-white dark:bg-gray-700 rounded shadow-md" />
          </div>
          <div className="flex items-center gap-2 text-xs text-purple-600 font-semibold">
            <span>⚲ Scroll to zoom</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'click-step',
    title: 'Click on a Step',
    description: 'Click on any step box to open the detail drawer with all tasks, documents, and progress.',
    icon: <MousePointer2 className="h-6 w-6" />,
    highlightElement: '.react-flow__node',
    position: 'left',
    preview: (
      <div className="relative">
        {/* Mock step box */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-blue-500 shadow-xl relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
              <MousePointer2 className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-sm">Step 2-1: Check Generator</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Duration: 2h</div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-1/3" />
            </div>
          </div>
        </div>
        <div className="mt-2 text-center">
          <ArrowRight className="h-4 w-4 mx-auto text-blue-600" />
          <div className="text-xs text-gray-600 mt-1">Click to open details</div>
        </div>
      </div>
    ),
  },
  {
    id: 'documents',
    title: 'Access Documents & Links',
    description: 'Click document badges to open SII PDFs. Blue underlined text = clickable section links.',
    icon: <FileText className="h-6 w-6" />,
    position: 'center',
    preview: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200">
          <div className="text-xs font-medium mb-2">11.5.1 Examine crane</div>
          <div className="flex gap-2">
            <div className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-bold cursor-pointer hover:bg-blue-600 transition-all">
              📄 SII-11
            </div>
            <div className="text-xs text-blue-600 underline cursor-pointer">Section 5.1 →</div>
          </div>
        </div>
        <div className="text-center">
          <ArrowRight className="h-4 w-4 mx-auto text-blue-600" />
          <div className="text-xs text-gray-600 mt-1">Opens PDF viewer</div>
        </div>
      </div>
    ),
  },
  {
    id: 'check-tasks',
    title: 'Check Off Tasks',
    description: 'Check tasks as you complete them. Progress updates automatically!',
    icon: <CheckSquare className="h-6 w-6" />,
    position: 'center',
    preview: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200">
          <div className="h-4 w-4 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center">
            <CheckSquare className="h-3 w-3 text-white" />
          </div>
          <div className="text-xs line-through text-gray-500">Task 1: Check oil level</div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border-2 border-blue-500">
          <div className="h-4 w-4 rounded border-2 border-gray-300" />
          <div className="text-xs font-medium">Task 2: Inspect bearings ← Click here!</div>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 transition-all duration-500" style={{ width: '50%' }} />
        </div>
        <div className="text-xs text-center text-gray-600">50% Complete</div>
      </div>
    ),
  },
  {
    id: 'log-time',
    title: 'Log Time for Tasks',
    description: 'Track actual time spent. See if you\'re ahead or behind schedule.',
    icon: <Clock className="h-6 w-6" />,
    position: 'center',
    preview: (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-medium">Check oil level</div>
          <button className="p-1 hover:bg-gray-100 rounded border-2 border-blue-500">
            <Clock className="h-4 w-4 text-blue-600" />
          </button>
        </div>
        <div className="space-y-2 pl-4 border-l-2 border-blue-500">
          <div className="text-xs text-gray-600">Target: 15 min</div>
          <div className="flex items-center gap-2">
            <input type="number" className="w-16 px-2 py-1 border rounded text-xs" placeholder="20" />
            <span className="text-xs">minutes</span>
          </div>
          <div className="text-xs text-red-600 font-semibold">+5 min overtime</div>
        </div>
      </div>
    ),
  },
  {
    id: 'notes',
    title: 'Add Notes',
    description: 'Document observations, deviations, and improvements. All timestamped!',
    icon: <StickyNote className="h-6 w-6" />,
    position: 'center',
    preview: (
      <div className="space-y-2">
        <div className="bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500 p-3 rounded">
          <div className="flex items-start gap-2">
            <StickyNote className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-medium text-amber-900 dark:text-amber-100">Note added</div>
              <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                "Found unusual wear on bearing. Recommend early replacement."
              </div>
              <div className="text-[10px] text-amber-600 mt-1">2024-01-15 14:32</div>
            </div>
          </div>
        </div>
        <button className="w-full p-2 border-2 border-dashed border-blue-400 rounded text-xs text-blue-600 hover:bg-blue-50">
          + Add Note
        </button>
      </div>
    ),
  },
  {
    id: 'completed-preview',
    title: 'Completed Step Preview',
    description: 'When all tasks are done, the step glows green! Progress bar hits 100%.',
    icon: <Eye className="h-6 w-6" />,
    position: 'center',
    preview: (
      <div className="relative">
        {/* Before state */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-300 mb-3 opacity-50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold">Step 2-1: Check Generator</div>
            <div className="text-xs text-gray-500">60%</div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-3/5" />
          </div>
        </div>

        <div className="text-center my-2">
          <span className="text-lg">↓</span>
        </div>

        {/* After state - completed! */}
        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border-2 border-green-500 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold text-green-900 dark:text-green-100 flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              Step 2-1: Check Generator
            </div>
            <div className="text-xs text-green-700 font-bold">100%</div>
          </div>
          <div className="h-2 bg-green-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 w-full" />
          </div>
          <div className="text-xs text-green-700 mt-2">✓ All tasks completed!</div>
        </div>
      </div>
    ),
  },
  {
    id: 'info-progress',
    title: 'Info & Progress Panel',
    description: 'Track overall progress, time, and service types. Drag to move, pin to keep open!',
    icon: <Info className="h-6 w-6" />,
    highlightElement: '[data-tutorial="info-panel"]',
    position: 'right',
    preview: (
      <div className="bg-blue-600/90 backdrop-blur-sm rounded-lg p-3 border border-blue-400 shadow-xl">
        <div className="flex items-center gap-2 mb-3 text-white">
          <Info className="h-4 w-4" />
          <span className="text-xs font-bold">Info & Progress</span>
        </div>
        <div className="space-y-2 bg-white dark:bg-gray-800 rounded p-2">
          <div className="text-[10px] text-gray-500 font-semibold">PROGRESS</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Tasks</span>
              <span className="font-bold">15/30</span>
            </div>
            <div className="h-1 bg-gray-200 rounded-full">
              <div className="h-full bg-green-500 w-1/2" />
            </div>
          </div>
          <div className="text-[10px] text-green-600">✓ On track!</div>
        </div>
      </div>
    ),
  },
  {
    id: 'offline',
    title: 'Offline Mode',
    description: 'Download all documents for offline access. Perfect for field work!',
    icon: <Download className="h-6 w-6" />,
    position: 'center',
    preview: (
      <div className="space-y-3">
        <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 border-2 border-blue-400">
          <Download className="h-5 w-5" />
          Make Available Offline
        </button>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium">Downloading...</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>SII-11: Service crane</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Loader2 className="h-3 w-3 text-blue-600" />
              <span>SII-12: High voltage...</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'complete',
    title: 'You\'re Ready! 🚀',
    description: 'You now know all the essential features. Explore more by clicking the AI guide button in the bottom-right corner anytime!',
    icon: <Sparkles className="h-6 w-6" />,
    position: 'center',
    preview: (
      <div className="text-center space-y-3">
        <div className="text-6xl">🎉</div>
        <div className="text-lg font-bold text-blue-600">
          You're all set!
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
          <Bot className="h-4 w-4" />
          <span>Find me in the bottom-right corner anytime</span>
        </div>
      </div>
    ),
  },
];

interface TutorialGuideProps {
  onComplete?: () => void;
}

export function TutorialGuide({ onComplete }: TutorialGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1); // Start with welcome dialog
  const [isMinimized, setIsMinimized] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showVersion, setShowVersion] = useState(false);

  // Check on mount if tutorial was completed - show icon group immediately
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('tutorial-completed');
    console.log('Tutorial: Checking on mount. hasSeenTutorial:', hasSeenTutorial);

    // Always show icons (skip tutorial requirement)
    setIsMinimized(true);
  }, []);

  // Listen for auto-open event after initial animation
  useEffect(() => {
    const handleAutoOpen = () => {
      const hasSeenTutorial = localStorage.getItem('tutorial-completed');
      console.log('Tutorial: Received auto-open event. hasSeenTutorial:', hasSeenTutorial);

      if (!hasSeenTutorial) {
        console.log('Tutorial: Auto-opening welcome dialog in 2500ms...');
        setTimeout(() => {
          setIsOpen(true);
          console.log('Tutorial: Dialog opened!');
        }, 2500); // 2.5 seconds after info dropdown opens
      }

      // Icons are always shown (set in mount effect)
    };

    window.addEventListener('tutorial-auto-open', handleAutoOpen);
    return () => window.removeEventListener('tutorial-auto-open', handleAutoOpen);
  }, []);

  const handleStart = () => {
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('tutorial-completed', 'true');
    setIsOpen(false);
    setIsMinimized(true);
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('tutorial-completed', 'true');
    setIsOpen(false);
    setIsMinimized(true);
  };

  const step = currentStep >= 0 ? tutorialSteps[currentStep] : null;
  const progress = currentStep >= 0 ? ((currentStep + 1) / tutorialSteps.length) * 100 : 0;

  return (
    <>
      {/* Welcome Dialog (before tutorial starts) */}
      <Dialog open={isOpen && currentStep === -1} onOpenChange={(open) => !open && handleSkip()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Hi! I'm your AI Guide 👋</DialogTitle>
                <DialogDescription>Let me show you around!</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Welcome to HRIS Flowchart Manager! I can give you a quick interactive tour showing you:
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Navigation className="h-4 w-4" />, text: 'How to navigate' },
                { icon: <MousePointer2 className="h-4 w-4" />, text: 'Clicking steps' },
                { icon: <FileText className="h-4 w-4" />, text: 'Finding documents' },
                { icon: <CheckSquare className="h-4 w-4" />, text: 'Checking tasks' },
                { icon: <Clock className="h-4 w-4" />, text: 'Logging time' },
                { icon: <StickyNote className="h-4 w-4" />, text: 'Adding notes' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="text-blue-600">{item.icon}</div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleStart}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Yes, show me around!
              </Button>
              <Button onClick={handleSkip} variant="outline" className="flex-1">
                Skip for now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tutorial Step Dialog */}
      <Dialog open={isOpen && currentStep >= 0 && step !== null} onOpenChange={(open) => !open && handleSkip()}>
        <DialogContent className="max-w-2xl">
          {step && (
            <>
              {/* Progress Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                      {step.icon}
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold">{step.title}</DialogTitle>
                      <DialogDescription>
                        Step {currentStep + 1} of {tutorialSteps.length}
                      </DialogDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSkip} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {step.description}
                </p>

                {/* Interactive Preview/Example */}
                {step.preview && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-blue-300 dark:border-blue-700">
                    {step.preview}
                  </div>
                )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                onClick={handlePrev}
                variant="outline"
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <Badge variant="secondary" className="px-3 py-1">
                {currentStep + 1} / {tutorialSteps.length}
              </Badge>

              <Button
                onClick={handleNext}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
                {currentStep === tutorialSteps.length - 1 ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Icon Group (bottom-right corner) */}
      {isMinimized && !isOpen && (
        <FloatingIconGroup
          position="bottom-right"
          icons={[
            defaultFloatingIcons.aiGuide(() => setShowHelp(true)),
            defaultFloatingIcons.version(() => setShowVersion(true)),
          ]}
        />
      )}

      {/* Help Center Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Book className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Help Center</DialogTitle>
                <DialogDescription>Learn about all features and functions</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Restart Tutorial */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-sm">Interactive Tutorial</h3>
                    <p className="text-xs text-muted-foreground">Take the guided tour again</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setShowHelp(false);
                    setCurrentStep(-1);
                    setIsOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Tutorial
                </Button>
              </div>
            </Card>

            {/* Feature List */}
            <div className="grid gap-3">
              <h3 className="font-semibold text-sm">All Features</h3>

              {helpSections.map((section) => (
                <Card key={section.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      {section.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{section.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{section.description}</p>
                      <ul className="space-y-1">
                        {section.points.map((point, idx) => (
                          <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-600" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Spotlight Overlay (when highlighting elements) */}
      {isOpen && step && step.highlightElement && (
        <div className="fixed inset-0 pointer-events-none z-[45]">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Pulsing ring around highlighted element */}
          <style jsx>{`
            @keyframes highlightPulse {
              0%, 100% {
                box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7),
                            0 0 20px 10px rgba(59, 130, 246, 0.4);
              }
              50% {
                box-shadow: 0 0 0 10px rgba(59, 130, 246, 0),
                            0 0 30px 15px rgba(59, 130, 246, 0.2);
              }
            }

            .spotlight-hint {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              pointer-events: none;
              animation: highlightPulse 2s infinite;
              border: 3px solid #3b82f6;
              border-radius: 12px;
              padding: 20px;
            }
          `}</style>

          {/* Helper text */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2">
              <span className="text-2xl">👆</span>
              <span className="text-sm font-semibold">Check out this feature!</span>
            </div>
          </div>
        </div>
      )}

      {/* Version Dialog */}
      <VersionDialog open={showVersion} onOpenChange={setShowVersion} />
    </>
  );
}

// Help sections with detailed explanations
const helpSections = [
  {
    id: 'navigation',
    title: 'Navigation',
    icon: <Navigation className="h-5 w-5 text-blue-600" />,
    description: 'Move around the flowchart canvas',
    points: [
      'Click and drag to pan the canvas',
      'Scroll to zoom in and out',
      'Use the Controls panel for zoom buttons',
      'Press "F" to fit all steps in view',
    ],
  },
  {
    id: 'steps',
    title: 'Working with Steps',
    icon: <MousePointer2 className="h-5 w-5 text-blue-600" />,
    description: 'Interact with service steps',
    points: [
      'Click any step to open details drawer',
      'View all tasks, duration, and technician info',
      'Check off tasks as you complete them',
      'Progress bar updates automatically',
      'Green checkmark when step is 100% complete',
    ],
  },
  {
    id: 'documents',
    title: 'Documents & Links',
    icon: <FileText className="h-5 w-5 text-blue-600" />,
    description: 'Access SII documents and references',
    points: [
      'Blue badges show linked SII documents',
      'Click document to open PDF viewer',
      'Underlined text = clickable section links',
      'PDFs open in new tab with section highlighted',
      'Download documents for offline access',
    ],
  },
  {
    id: 'time-tracking',
    title: 'Time Tracking',
    icon: <Clock className="h-5 w-5 text-blue-600" />,
    description: 'Log actual time spent on tasks',
    points: [
      'Click clock icon next to each task',
      'Enter time in hours and minutes',
      'Compare actual vs. target time',
      'Progress panel shows if ahead/behind schedule',
      'Green = ahead, red = overtime',
    ],
  },
  {
    id: 'notes',
    title: 'Notes & Observations',
    icon: <StickyNote className="h-5 w-5 text-blue-600" />,
    description: 'Document deviations and improvements',
    points: [
      'Click note icon to add observations',
      'All notes are timestamped',
      'Edit or delete notes anytime',
      'Notes count shown in Info panel',
      'Export notes with flowchart data',
    ],
  },
  {
    id: 'progress',
    title: 'Progress Tracking',
    icon: <Info className="h-5 w-5 text-blue-600" />,
    description: 'Monitor overall completion',
    points: [
      'Info & Progress panel shows overview',
      'Task completion percentage',
      'Target time vs. actual time',
      'Pin panel to keep it open',
      'Drag to reposition anywhere',
    ],
  },
  {
    id: 'offline',
    title: 'Offline Mode',
    icon: <Download className="h-5 w-5 text-blue-600" />,
    description: 'Work without internet connection',
    points: [
      'Click "Make Available Offline"',
      'Downloads all SII documents',
      'Progress bar for each document',
      'Access PDFs without internet',
      'Perfect for field work',
    ],
  },
  {
    id: 'edit-mode',
    title: 'Edit Mode',
    icon: <Maximize2 className="h-5 w-5 text-blue-600" />,
    description: 'Customize flowchart layout',
    points: [
      'Toggle Edit Mode from header',
      'Drag steps to reposition',
      'Connect steps with edges',
      'Auto-align to grid',
      'Save custom layouts',
    ],
  },
];
