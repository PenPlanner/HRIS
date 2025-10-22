"use client"

import { useState, useEffect } from "react";
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
import { CheckCircle, Save, Info } from "lucide-react";

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
    case 'Field Trainer':
      return { bg: '#f59e0b', text: '#ffffff', border: '#d97706' }; // Amber/Gold
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

export function KompetensmatrisForm({ technicianId }: { technicianId: string }) {
  const [data, setData] = useState<AssessmentData>({
    vestas_level: 'D',
    internal_experience: '',
    external_experience: '',
    education: [],
    extra_courses: [],
    subjective_score: 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [initialData, setInitialData] = useState<AssessmentData | null>(null);
  const [initialPoints, setInitialPoints] = useState<number>(0);
  const [initialLevel, setInitialLevel] = useState<number>(1);

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
    if (level === 'Field Trainer') return 2.5;
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
    const saved = localStorage.getItem(`assessment_${technicianId}`);
    if (saved) {
      const savedData = JSON.parse(saved);
      setData(savedData);
      setInitialData(savedData);

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

      setInitialPoints(total);
      setInitialLevel(getFinalLevel(total));
    }
  }, [technicianId]);

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
    const timer = setTimeout(() => {
      setIsSaving(true);

      // Check if there are changes
      if (initialData) {
        const changes = detectChanges(initialData, data, initialPoints, totalPoints);

        // If there are changes, create a history entry
        if (changes.length > 0) {
          const historyEntry: AssessmentHistory = {
            id: Date.now().toString(),
            technician_id: technicianId,
            timestamp: new Date().toISOString(),
            previous_level: initialLevel,
            new_level: finalLevel,
            previous_points: initialPoints,
            new_points: totalPoints,
            previous_vestas_level: initialData.vestas_level,
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

          // Update initial data to current data
          setInitialData(data);
          setInitialPoints(totalPoints);
          setInitialLevel(finalLevel);
        }
      } else {
        // First save - set initial data
        setInitialData(data);
        setInitialPoints(totalPoints);
        setInitialLevel(finalLevel);
      }

      // Save current assessment
      localStorage.setItem(`assessment_${technicianId}`, JSON.stringify(data));

      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 500);
    }, 500);

    return () => clearTimeout(timer);
  }, [data, technicianId, initialData, initialPoints, totalPoints, initialLevel, finalLevel]);

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

  return (
    <div className="space-y-6">
      {/* Save indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isSaving ? (
            <>
              <Save className="h-4 w-4 animate-pulse" />
              Saving...
            </>
          ) : lastSaved ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              Saved {lastSaved.toLocaleTimeString()}
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Points</p>
            <p className="text-2xl font-bold">{totalPoints}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Competency Level</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Competency Level Descriptions</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {COMPETENCY_LEVELS.map((level) => (
                      <Card key={level.level} className={finalLevel === level.level ? "border-primary border-2" : ""}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <Badge className="text-base px-3 py-1">Level {level.level}</Badge>
                            <CardTitle className="text-base">{level.title}</CardTitle>
                            {finalLevel === level.level && (
                              <Badge variant="secondary" className="ml-auto">Current Level</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{level.pointRange}</p>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{level.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="group relative inline-block">
              <Badge className="text-lg px-3 py-1 cursor-help">Level {finalLevel}</Badge>
              {currentLevelInfo && (
                <div className="invisible group-hover:visible absolute right-0 top-full mt-2 w-80 z-50 rounded-lg border bg-popover p-4 text-popover-foreground shadow-md">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="text-sm">Level {currentLevelInfo.level}</Badge>
                      <p className="text-sm font-semibold">{currentLevelInfo.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{currentLevelInfo.pointRange}</p>
                    <p className="text-sm">{currentLevelInfo.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vestas Internal Level */}
      <Card>
        <CardHeader>
          <CardTitle>Vestas Internal Level</CardTitle>
          <CardDescription>Choose only 1 option</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(['D', 'C', 'B', 'A', 'Field Trainer'] as VestasLevel[]).map((level) => {
            const colors = getVestasLevelColor(level);
            const isSelected = data.vestas_level === level;
            return (
              <label
                key={level}
                className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all"
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
                  className="h-4 w-4"
                  style={{ accentColor: colors.bg }}
                />
                <Badge
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: colors.border
                  }}
                  className="min-w-[40px] justify-center"
                >
                  {level}
                </Badge>
                <span className="font-medium flex-1">
                  {level === 'Field Trainer' && 'Field Trainer (Highest level) - 2.5x multiplier'}
                  {level === 'A' && 'A-Level (Turbine specific experts) - 2.0x multiplier'}
                  {level === 'B' && 'B-Level (Turbine specific) - 2.0x multiplier'}
                  {level === 'C' && 'C-Level (Turbine specific) - 1.5x multiplier'}
                  {level === 'D' && 'D-Level - 1.0x multiplier'}
                </span>
              </label>
            );
          })}
        </CardContent>
      </Card>

      {/* Internal Experience */}
      <Card>
        <CardHeader>
          <CardTitle>Internal Experience (Electrical Works)</CardTitle>
          <CardDescription>Experience multiplied by {multiplier}x</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={data.internal_experience}
            onChange={(e) => setData({ ...data, internal_experience: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select...</option>
            {INTERNAL_EXPERIENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} - {opt.points} points
              </option>
            ))}
          </select>
          {internalExpPoints > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {internalExpPoints} points × {multiplier} = {Math.round(internalExpPoints * multiplier)} points
            </p>
          )}
        </CardContent>
      </Card>

      {/* External Experience */}
      <Card>
        <CardHeader>
          <CardTitle>External Experience on Electrical Work</CardTitle>
          <CardDescription>Experience multiplied by {multiplier}x</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={data.external_experience}
            onChange={(e) => setData({ ...data, external_experience: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select...</option>
            {EXTERNAL_EXPERIENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} - {opt.points} points
              </option>
            ))}
          </select>
          {externalExpPoints > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {externalExpPoints} points × {multiplier} = {Math.round(externalExpPoints * multiplier)} points
            </p>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle>External Education</CardTitle>
          <CardDescription>Select all that apply (Multiple selections possible)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {EDUCATION_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                value={opt.value}
                checked={data.education.includes(opt.value)}
                onChange={() => toggleEducation(opt.value)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>
                {opt.label} - <span className="font-medium">{opt.points} points</span>
              </span>
            </label>
          ))}
          {educationPoints > 0 && (
            <p className="mt-2 text-sm font-medium text-primary">
              Total Education Points: {educationPoints}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Extra Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Extra Internal Education</CardTitle>
          <CardDescription>Select all that apply (Max 28 points)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {EXTRA_COURSES.map((course) => (
            <label key={course.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.extra_courses.includes(course.value)}
                onChange={() => toggleExtraCourse(course.value)}
                className="h-4 w-4"
              />
              <span>
                {course.label} - <span className="font-medium">{course.points} points</span>
              </span>
            </label>
          ))}
          {extraCoursesPoints > 0 && (
            <p className="mt-2 text-sm font-medium">
              Total: {extraCoursesPoints} points
            </p>
          )}
        </CardContent>
      </Card>

      {/* Subjective Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Subjective Assessment of Electrical Safety Awareness</CardTitle>
          <CardDescription>
            0-5 points. 5 = role model who never bends on electrical safety, 0 = lacks awareness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Slider
              value={[data.subjective_score]}
              onValueChange={(value) => setData({ ...data, subjective_score: value[0] })}
              max={5}
              step={1}
              className="flex-1"
            />
            <Badge variant="secondary" className="text-lg px-3">
              {data.subjective_score}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>Assessment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Vestas Level</p>
              <Badge
                style={{
                  backgroundColor: getVestasLevelColor(data.vestas_level).bg,
                  color: getVestasLevelColor(data.vestas_level).text,
                  borderColor: getVestasLevelColor(data.vestas_level).border
                }}
                className="text-lg px-3 py-1"
              >
                {data.vestas_level}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Experience Multiplier</p>
              <p className="text-2xl font-bold">{multiplier}x</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Education Points</p>
              <p className="text-xl font-semibold">{educationPoints}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Extra Courses Points</p>
              <p className="text-xl font-semibold">{extraCoursesPoints}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Experience Points (Multiplied)</p>
              <p className="text-xl font-semibold">{multipliedExperience}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Subjective Points</p>
              <p className="text-xl font-semibold">{data.subjective_score}</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Points (Max 163)</p>
                <p className="text-3xl font-bold">{totalPoints}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Behörighetsnivå</p>
                <Badge className="text-2xl px-4 py-2" variant={finalLevel >= 4 ? "default" : "secondary"}>
                  Level {finalLevel}
                </Badge>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Level 1: 0-14 points | Level 2: 15-43 points | Level 3: 44-79 points | Level 4: 80-100 points | Level 5: 100+ points
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
