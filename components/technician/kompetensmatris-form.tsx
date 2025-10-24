"use client"

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle, Save, Info, Edit } from "lucide-react";

type VestasLevel = 'D' | 'C' | 'B' | 'A' | 'Field Trainer';

interface AssessmentData {
  vestas_level: VestasLevel;
  internal_experience: string;
  external_experience: string;
  education: string[];
  extra_courses: string[];
  subjective_score: number;
}

interface AssessmentHistory {
  id: string;
  technician_id: string;
  timestamp: string;
  previous_level: number;
  new_level: number;
  previous_points: number;
  new_points: number;
  previous_vestas_level: VestasLevel;
  new_vestas_level: VestasLevel;
  changes: string[];
}

// Vestas Level Colors
const getVestasLevelColor = (level: VestasLevel): { bg: string; text: string; border: string } => {
  switch (level) {
    case 'D':
      return { bg: '#9ca3af', text: '#ffffff', border: '#6b7280' }; // Gray
    case 'C':
      return { bg: '#3b82f6', text: '#ffffff', border: '#2563eb' }; // Blue
    case 'B':
      return { bg: '#10b981', text: '#ffffff', border: '#059669' }; // Green
    case 'A':
      return { bg: '#8b5cf6', text: '#ffffff', border: '#7c3aed' }; // Purple
    default:
      return { bg: '#9ca3af', text: '#ffffff', border: '#6b7280' };
  }
};

const INTERNAL_EXPERIENCE_OPTIONS = [
  { label: "Electrical Works 6 months", value: "6months", points: 8 },
  { label: "1 Year", value: "1year", points: 20 },
  { label: "2 Years", value: "2years", points: 22 },
  { label: "3 Years", value: "3years", points: 25 },
  { label: "4 Years", value: "4years", points: 27 },
  { label: "5+ Years", value: "5years", points: 30 },
];

const EXTERNAL_EXPERIENCE_OPTIONS = [
  { label: "0.5-2 Years as Electrician", value: "0.5-2", points: 5 },
  { label: "2-3 Years as Electrician", value: "2-3", points: 10 },
  { label: "3+ Years as Electrician", value: "3+", points: 15 },
];

const EDUCATION_OPTIONS = [
  { label: "Electrical Education", value: "electrical", points: 40 },
  { label: "EN50110 Training (Vestas Internal)", value: "en50110", points: 35 },
  { label: "Wind Turbine Education", value: "wind", points: 25 },
  { label: "Technical Education (incl. electrical modules)", value: "technical", points: 20 },
  { label: "No relevant Training", value: "none", points: 0 },
];

const EXTRA_COURSES = [
  { label: "Electrical Knowledge Sweden", value: "eks", points: 15 },
  { label: "Electrical Safety for Qualified", value: "esq", points: 10 },
  { label: "Add on C-Level HV", value: "hv", points: 8 },
];

const COMPETENCY_LEVELS = [
  {
    level: 1,
    title: "Supervised Worker",
    description: "Only allowed to work under another Person in Charge",
    pointRange: "0-14 points"
  },
  {
    level: 2,
    title: "Mechanical: PiC + LOTO",
    description: "Person in Charge of mechanical work activity which does not include electrical Lockouts (only Mec. LOTOs)",
    pointRange: "15-43 points"
  },
  {
    level: 3,
    title: "LV, EL & MEC: PiC + LOTO",
    description: "Person in charge of both Mech and Low Voltage Electrical LOTOs but no troubleshooting",
    pointRange: "44-79 points"
  },
  {
    level: 4,
    title: "LV, EL & MEC: PiC + LOTO + TR",
    description: "Person in charge of both Mech and Electrical LOTOs including troubleshooting on Low Voltage",
    pointRange: "80-99 points"
  },
  {
    level: 5,
    title: "HV, EL & MEC: PiC + LOTO + TR",
    description: "Person in charge of both Mech and High Voltage Electrical LOTOs including troubleshooting",
    pointRange: "100+ points"
  }
];

interface KompetensmatrisFormProps {
  technicianId: string;
  initialData?: {
    vestas_level: VestasLevel;
    internal_experience: string;
    external_experience: string;
    education: string[];
    extra_courses: string[];
    subjective_score: number;
    total_points: number;
    final_level: number;
    submitted_to_ecc: boolean;
    last_updated: string;
  };
}

export function KompetensmatrisForm({ technicianId, initialData }: KompetensmatrisFormProps) {
  // Convert initial data to form format
  const getInitialFormData = (): AssessmentData => {
    if (initialData) {
      return {
        vestas_level: initialData.vestas_level,
        internal_experience: initialData.internal_experience,
        external_experience: initialData.external_experience,
        education: initialData.education,
        extra_courses: initialData.extra_courses,
        subjective_score: initialData.subjective_score,
      };
    }

    return {
      vestas_level: 'D',
      internal_experience: '',
      external_experience: '',
      education: [],
      extra_courses: [],
      subjective_score: 0,
    };
  };

  // Initialize with empty state - let useEffect handle data loading
  const [data, setData] = useState<AssessmentData>(() => {
    // Only use initialData if it exists, otherwise empty state
    if (initialData) {
      return {
        vestas_level: initialData.vestas_level,
        internal_experience: initialData.internal_experience,
        external_experience: initialData.external_experience,
        education: initialData.education,
        extra_courses: initialData.extra_courses,
        subjective_score: initialData.subjective_score,
      };
    }
    return {
      vestas_level: 'D',
      internal_experience: '',
      external_experience: '',
      education: [],
      extra_courses: [],
      subjective_score: 0,
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditMode, setIsEditMode] = useState(!initialData); // Edit mode ON if no initial data (new assessment)

  // Use refs to track initial state for history comparison
  const initialDataRef = useRef<AssessmentData | null>(null);
  const initialPointsRef = useRef<number>(0);
  const initialLevelRef = useRef<number>(1);

  // Calculate points
  const internalExpPoints = INTERNAL_EXPERIENCE_OPTIONS.find(opt => opt.value === data.internal_experience)?.points || 0;
  const externalExpPoints = EXTERNAL_EXPERIENCE_OPTIONS.find(opt => opt.value === data.external_experience)?.points || 0;
  const educationPoints = data.education.reduce((sum, edu) => {
    const points = EDUCATION_OPTIONS.find(e => e.value === edu)?.points || 0;
    return sum + points;
  }, 0);
  const extraCoursesPoints = data.extra_courses.reduce((sum, course) => {
    const points = EXTRA_COURSES.find(c => c.value === course)?.points || 0;
    return sum + points;
  }, 0);

  // Experience multiplier based on Vestas level
  const getMultiplier = (level: VestasLevel): number => {
    if (level === 'A' || level === 'B') return 2.0;
    if (level === 'C') return 1.5;
    return 1.0; // D
  };

  const multiplier = getMultiplier(data.vestas_level);
  const multipliedExperience = Math.round((internalExpPoints + externalExpPoints) * multiplier);
  const totalPoints = educationPoints + extraCoursesPoints + multipliedExperience + data.subjective_score;

  // Calculate final level (1-5)
  const getFinalLevel = (points: number): number => {
    if (points >= 100) return 5;
    if (points >= 80) return 4;
    if (points >= 44) return 3;
    if (points >= 15) return 2;
    return 1;
  };

  const finalLevel = getFinalLevel(totalPoints);

  // Load existing assessment on mount
  useEffect(() => {
    // Prioritize initialData over localStorage
    if (initialData) {
      // Use the passed initial data (from technician profile)
      const formData = getInitialFormData();
      setData(formData);

      // Calculate points from initialData
      const internalExp = INTERNAL_EXPERIENCE_OPTIONS.find(opt => opt.value === initialData.internal_experience)?.points || 0;
      const externalExp = EXTERNAL_EXPERIENCE_OPTIONS.find(opt => opt.value === initialData.external_experience)?.points || 0;
      const education = initialData.education.reduce((sum: number, edu: string) => {
        const points = EDUCATION_OPTIONS.find(e => e.value === edu)?.points || 0;
        return sum + points;
      }, 0);
      const extraCourses = initialData.extra_courses.reduce((sum: number, course: string) => {
        const points = EXTRA_COURSES.find(c => c.value === course)?.points || 0;
        return sum + points;
      }, 0);
      const multiplier = getMultiplier(initialData.vestas_level);
      const multipliedExp = Math.round((internalExp + externalExp) * multiplier);
      const total = education + extraCourses + multipliedExp + initialData.subjective_score;

      // Store in refs for history comparison
      initialDataRef.current = formData;
      initialPointsRef.current = total;
      initialLevelRef.current = getFinalLevel(total);
    } else {
      // Fall back to localStorage if no initial data
      const saved = localStorage.getItem(`assessment_${technicianId}`);
      if (saved) {
        const savedData = JSON.parse(saved);
        setData(savedData);

        // Calculate initial points and level
        const internalExp = INTERNAL_EXPERIENCE_OPTIONS.find(opt => opt.value === savedData.internal_experience)?.points || 0;
        const externalExp = EXTERNAL_EXPERIENCE_OPTIONS.find(opt => opt.value === savedData.external_experience)?.points || 0;
        const education = savedData.education.reduce((sum: number, edu: string) => {
          const points = EDUCATION_OPTIONS.find(e => e.value === edu)?.points || 0;
          return sum + points;
        }, 0);
        const extraCourses = savedData.extra_courses.reduce((sum: number, course: string) => {
          const points = EXTRA_COURSES.find(c => c.value === course)?.points || 0;
          return sum + points;
        }, 0);
        const multiplier = getMultiplier(savedData.vestas_level);
        const multipliedExp = Math.round((internalExp + externalExp) * multiplier);
        const total = education + extraCourses + multipliedExp + savedData.subjective_score;

        // Store in refs for history comparison
        initialDataRef.current = savedData;
        initialPointsRef.current = total;
        initialLevelRef.current = getFinalLevel(total);
      }
    }
  }, [technicianId, initialData]);

  // Helper function to detect changes
  const detectChanges = (oldData: AssessmentData, newData: AssessmentData, oldPoints: number, newPoints: number): string[] => {
    const changes: string[] = [];

    if (oldData.vestas_level !== newData.vestas_level) {
      changes.push(`Vestas Level: ${oldData.vestas_level} → ${newData.vestas_level}`);
    }

    if (oldData.internal_experience !== newData.internal_experience) {
      const oldLabel = INTERNAL_EXPERIENCE_OPTIONS.find(opt => opt.value === oldData.internal_experience)?.label || 'None';
      const newLabel = INTERNAL_EXPERIENCE_OPTIONS.find(opt => opt.value === newData.internal_experience)?.label || 'None';
      changes.push(`Internal Experience: ${oldLabel} → ${newLabel}`);
    }

    if (oldData.external_experience !== newData.external_experience) {
      const oldLabel = EXTERNAL_EXPERIENCE_OPTIONS.find(opt => opt.value === oldData.external_experience)?.label || 'None';
      const newLabel = EXTERNAL_EXPERIENCE_OPTIONS.find(opt => opt.value === newData.external_experience)?.label || 'None';
      changes.push(`External Experience: ${oldLabel} → ${newLabel}`);
    }

    // Check education changes
    const addedEducation = newData.education.filter(e => !oldData.education.includes(e));
    const removedEducation = oldData.education.filter(e => !newData.education.includes(e));

    addedEducation.forEach(edu => {
      const label = EDUCATION_OPTIONS.find(e => e.value === edu)?.label;
      if (label) changes.push(`Added Education: ${label}`);
    });

    removedEducation.forEach(edu => {
      const label = EDUCATION_OPTIONS.find(e => e.value === edu)?.label;
      if (label) changes.push(`Removed Education: ${label}`);
    });

    // Check extra courses changes
    const addedCourses = newData.extra_courses.filter(c => !oldData.extra_courses.includes(c));
    const removedCourses = oldData.extra_courses.filter(c => !newData.extra_courses.includes(c));

    addedCourses.forEach(course => {
      const label = EXTRA_COURSES.find(c => c.value === course)?.label;
      if (label) changes.push(`Added Course: ${label}`);
    });

    removedCourses.forEach(course => {
      const label = EXTRA_COURSES.find(c => c.value === course)?.label;
      if (label) changes.push(`Removed Course: ${label}`);
    });

    if (oldData.subjective_score !== newData.subjective_score) {
      changes.push(`Subjective Score: ${oldData.subjective_score} → ${newData.subjective_score}`);
    }

    if (oldPoints !== newPoints) {
      changes.push(`Total Points: ${oldPoints} → ${newPoints}`);
    }

    return changes;
  };

  // Auto-save with debounce and history tracking
  useEffect(() => {
    // Skip auto-save if we're using initialData from parent (read-only mode)
    if (initialData) {
      return;
    }

    const timer = setTimeout(() => {
      setIsSaving(true);

      // Check if there are changes
      if (initialDataRef.current) {
        const changes = detectChanges(initialDataRef.current, data, initialPointsRef.current, totalPoints);

        // If there are changes, create a history entry
        if (changes.length > 0) {
          const historyEntry: AssessmentHistory = {
            id: Date.now().toString(),
            technician_id: technicianId,
            timestamp: new Date().toISOString(),
            previous_level: initialLevelRef.current,
            new_level: finalLevel,
            previous_points: initialPointsRef.current,
            new_points: totalPoints,
            previous_vestas_level: initialDataRef.current.vestas_level,
            new_vestas_level: data.vestas_level,
            changes: changes
          };

          // Get existing history
          const existingHistory = localStorage.getItem(`assessment_history_${technicianId}`);
          const history: AssessmentHistory[] = existingHistory ? JSON.parse(existingHistory) : [];

          // Add new entry (keep last 50 entries)
          history.unshift(historyEntry);
          if (history.length > 50) {
            history.pop();
          }

          // Save history
          localStorage.setItem(`assessment_history_${technicianId}`, JSON.stringify(history));

          // Update initial data to current data in refs
          initialDataRef.current = data;
          initialPointsRef.current = totalPoints;
          initialLevelRef.current = finalLevel;
        }
      } else {
        // First save - set initial data in refs
        initialDataRef.current = data;
        initialPointsRef.current = totalPoints;
        initialLevelRef.current = finalLevel;
      }

      // Save current assessment
      localStorage.setItem(`assessment_${technicianId}`, JSON.stringify(data));

      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 500);
    }, 500);

    return () => clearTimeout(timer);
  }, [data, technicianId, totalPoints, finalLevel, initialData]);

  const toggleExtraCourse = (courseValue: string) => {
    setData(prev => ({
      ...prev,
      extra_courses: prev.extra_courses.includes(courseValue)
        ? prev.extra_courses.filter(c => c !== courseValue)
        : [...prev.extra_courses, courseValue]
    }));
  };

  const toggleEducation = (educationValue: string) => {
    setData(prev => ({
      ...prev,
      education: prev.education.includes(educationValue)
        ? prev.education.filter(e => e !== educationValue)
        : [...prev.education, educationValue]
    }));
  };

  const currentLevelInfo = COMPETENCY_LEVELS.find(l => l.level === finalLevel);

  // Save changes function
  const handleSaveChanges = () => {
    setIsSaving(true);

    // Create history entry if there are changes
    if (initialDataRef.current) {
      const changes = detectChanges(initialDataRef.current, data, initialPointsRef.current, totalPoints);

      if (changes.length > 0) {
        const historyEntry: AssessmentHistory = {
          id: Date.now().toString(),
          technician_id: technicianId,
          timestamp: new Date().toISOString(),
          previous_level: initialLevelRef.current,
          new_level: finalLevel,
          previous_points: initialPointsRef.current,
          new_points: totalPoints,
          previous_vestas_level: initialDataRef.current.vestas_level,
          new_vestas_level: data.vestas_level,
          changes: changes
        };

        // Get existing history
        const existingHistory = localStorage.getItem(`assessment_history_${technicianId}`);
        const history: AssessmentHistory[] = existingHistory ? JSON.parse(existingHistory) : [];

        // Add new entry
        history.unshift(historyEntry);
        if (history.length > 50) {
          history.pop();
        }

        // Save history
        localStorage.setItem(`assessment_history_${technicianId}`, JSON.stringify(history));
      }
    }

    // Save current assessment
    localStorage.setItem(`assessment_${technicianId}`, JSON.stringify(data));

    // Update refs
    initialDataRef.current = data;
    initialPointsRef.current = totalPoints;
    initialLevelRef.current = finalLevel;

    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      setIsEditMode(false);
    }, 500);
  };

  // Cancel changes function
  const handleCancelChanges = () => {
    if (initialDataRef.current) {
      setData(initialDataRef.current);
    }
    setIsEditMode(false);
  };

  return (
    <div className="space-y-6">
      {/* Assessment Header - Combined View */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Current Assessment</p>
              {initialData && (
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-muted-foreground">
                    Last updated: {initialData.last_updated} ({new Date(initialData.last_updated).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })})
                  </p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-muted-foreground">
                    Last points: <span className="font-semibold text-foreground">{initialData.total_points} pts</span>
                  </p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-muted-foreground">
                    Last level: <span className="font-semibold text-foreground">Level {initialData.final_level}</span>
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {isSaving ? (
                  <>
                    <Save className="h-3 w-3 animate-pulse" />
                    Saving...
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Saved {lastSaved.toLocaleTimeString()}
                  </>
                ) : null}
              </div>
            </div>

            {/* Current Values */}
            <div className="flex items-center gap-3 mr-4">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Total Points</p>
                <Badge className="text-sm px-2 py-0.5 font-semibold" variant={totalPoints !== initialData?.total_points ? "default" : "secondary"}>
                  {totalPoints}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Competency Level</p>
                <div className="group relative">
                  <Badge className="text-sm px-2 py-0.5 font-semibold cursor-help" variant={finalLevel !== initialData?.final_level ? "default" : "secondary"}>
                    Level {finalLevel}
                  </Badge>
                  {currentLevelInfo && (
                    <div className="invisible group-hover:visible absolute right-0 top-full mt-2 w-80 z-50 rounded-lg border-2 bg-popover p-3 text-popover-foreground shadow-xl">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="text-sm bg-primary">Level {currentLevelInfo.level}</Badge>
                          <p className="text-sm font-bold">{currentLevelInfo.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">{currentLevelInfo.pointRange}</p>
                        <p className="text-sm leading-relaxed">{currentLevelInfo.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Edit/Save/Cancel Actions */}
            {initialData && (
              <div className="flex items-center gap-2">
                {!isEditMode ? (
                  <Button
                    onClick={() => setIsEditMode(true)}
                    variant="default"
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Matrix
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleSaveChanges}
                      variant="default"
                      className="gap-2 bg-green-600 hover:bg-green-700"
                      disabled={isSaving}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      onClick={handleCancelChanges}
                      variant="outline"
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compact Grid Layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Vestas Internal Level */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Vestas Internal Level</CardTitle>
            <CardDescription className="text-xs">Choose only 1 option</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(['D', 'C', 'B', 'A'] as VestasLevel[]).map((level) => {
              const colors = getVestasLevelColor(level);
              const isSelected = data.vestas_level === level;
              return (
                <label
                  key={level}
                  className={`flex items-center gap-2 p-2 rounded border transition-all text-sm ${isEditMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                  style={{
                    backgroundColor: isSelected ? `${colors.bg}15` : 'transparent',
                    borderColor: isSelected ? colors.border : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="vestas_level"
                    value={level}
                    checked={isSelected}
                    onChange={(e) => setData({ ...data, vestas_level: e.target.value as VestasLevel })}
                    className="h-3 w-3"
                    style={{ accentColor: colors.bg }}
                    disabled={!isEditMode}
                  />
                  <Badge
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.border
                    }}
                    className="text-xs px-2 py-0.5"
                  >
                    {level}
                  </Badge>
                  <span className="text-xs">
                    {level === 'A' && '2.0x'}
                    {level === 'B' && '2.0x'}
                    {level === 'C' && '1.5x'}
                    {level === 'D' && '1.0x'}
                  </span>
                </label>
              );
            })}
          </CardContent>
        </Card>

        {/* Experience Section */}
        <div className="space-y-4">
          {/* Internal Experience */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Internal Experience</CardTitle>
              <CardDescription className="text-xs">Multiplied by {multiplier}x</CardDescription>
            </CardHeader>
            <CardContent>
              <select
                value={data.internal_experience}
                onChange={(e) => setData({ ...data, internal_experience: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isEditMode}
              >
                <option value="">Select...</option>
                {INTERNAL_EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.points}pts
                  </option>
                ))}
              </select>
              {internalExpPoints > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {internalExpPoints} × {multiplier} = {Math.round(internalExpPoints * multiplier)}pts
                </p>
              )}
            </CardContent>
          </Card>

          {/* External Experience */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">External Experience</CardTitle>
              <CardDescription className="text-xs">Multiplied by {multiplier}x</CardDescription>
            </CardHeader>
            <CardContent>
              <select
                value={data.external_experience}
                onChange={(e) => setData({ ...data, external_experience: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isEditMode}
              >
                <option value="">Select...</option>
                {EXTERNAL_EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.points}pts
                  </option>
                ))}
              </select>
              {externalExpPoints > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {externalExpPoints} × {multiplier} = {Math.round(externalExpPoints * multiplier)}pts
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Education and Courses Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Education */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">External Education</CardTitle>
            <CardDescription className="text-xs">Multiple selections possible</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {EDUCATION_OPTIONS.map((opt) => (
              <label key={opt.value} className={`flex items-center gap-2 text-sm p-1.5 rounded ${isEditMode ? 'cursor-pointer hover:bg-accent' : 'cursor-not-allowed opacity-50'}`}>
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={data.education.includes(opt.value)}
                  onChange={() => toggleEducation(opt.value)}
                  className="h-3 w-3 rounded"
                  disabled={!isEditMode}
                />
                <span className="flex-1">{opt.label}</span>
                <span className="font-medium text-xs">{opt.points}pts</span>
              </label>
            ))}
            {educationPoints > 0 && (
              <p className="mt-2 text-xs font-medium text-primary pt-2 border-t">
                Total: {educationPoints} points
              </p>
            )}
          </CardContent>
        </Card>

        {/* Extra Courses and Subjective */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Extra Internal Education</CardTitle>
              <CardDescription className="text-xs">Max 28 points</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {EXTRA_COURSES.map((course) => (
                <label key={course.value} className={`flex items-center gap-2 text-sm p-1.5 rounded ${isEditMode ? 'cursor-pointer hover:bg-accent' : 'cursor-not-allowed opacity-50'}`}>
                  <input
                    type="checkbox"
                    checked={data.extra_courses.includes(course.value)}
                    onChange={() => toggleExtraCourse(course.value)}
                    className="h-3 w-3"
                    disabled={!isEditMode}
                  />
                  <span className="flex-1">{course.label}</span>
                  <span className="font-medium text-xs">{course.points}pts</span>
                </label>
              ))}
              {extraCoursesPoints > 0 && (
                <p className="mt-2 text-xs font-medium pt-2 border-t">
                  Total: {extraCoursesPoints} points
                </p>
              )}
            </CardContent>
          </Card>

          {/* Subjective Assessment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Subjective Assessment</CardTitle>
              <CardDescription className="text-xs">
                Electrical Safety Awareness (0-5 pts)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Slider
                  value={[data.subjective_score]}
                  onValueChange={(value) => setData({ ...data, subjective_score: value[0] })}
                  max={5}
                  step={1}
                  disabled={!isEditMode}
                  className="flex-1"
                />
                <Badge variant="secondary" className="text-base px-3 min-w-[45px] justify-center">
                  {data.subjective_score}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary - Compact */}
      <Card className="border-primary">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Assessment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Vestas Level</p>
              <Badge
                style={{
                  backgroundColor: getVestasLevelColor(data.vestas_level).bg,
                  color: getVestasLevelColor(data.vestas_level).text,
                  borderColor: getVestasLevelColor(data.vestas_level).border
                }}
                className="text-sm px-2 py-1"
              >
                {data.vestas_level}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Multiplier</p>
              <p className="text-lg font-bold">{multiplier}x</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Education</p>
              <p className="text-lg font-semibold">{educationPoints}pts</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Extra Courses</p>
              <p className="text-lg font-semibold">{extraCoursesPoints}pts</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Experience</p>
              <p className="text-lg font-semibold">{multipliedExperience}pts</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subjective</p>
              <p className="text-lg font-semibold">{data.subjective_score}pts</p>
            </div>
          </div>
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Points (Max 163)</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Competency Level</p>
                <Badge className="text-xl px-3 py-1.5" variant={finalLevel >= 4 ? "default" : "secondary"}>
                  Level {finalLevel}
                </Badge>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              L1: 0-14 | L2: 15-43 | L3: 44-79 | L4: 80-99 | L5: 100+
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
