"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, CheckCircle, Info } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KompetensmatrisForm } from "@/components/technician/kompetensmatris-form";
import { TrainingNeedsManager } from "@/components/technician/training-needs-manager";
import { AssessmentHistory } from "@/components/technician/assessment-history";

type VestasLevel = 'D' | 'C' | 'B' | 'A' | 'Field Trainer';

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

const mockTechnician = {
  id: "1",
  first_name: "Markus",
  last_name: "Anderson",
  initials: "MRADR",
  team_name: "Travel S",
  team_color: "#06b6d4",
  email: "markus.anderson@example.com",
  phone: "+46 70 123 4567",
  vestas_level: "B" as const,
  competency_level: 5,
  profile_picture_url: undefined,
  assessment: {
    vestas_level: "B",
    internal_experience: "2years", // 20 points × 2.0 = 40
    external_experience: "2-3", // 10 points × 2.0 = 20
    education: ["electrical"], // 40 points
    extra_courses: [], // 0 points
    subjective_score: 1, // 1 point
    total_points: 101, // 40 + 40 + 20 + 1 = 101
    final_level: 5, // 101 points = Level 5 (100+ points)
    submitted_to_ecc: false,
    last_updated: "2025-09-23",
  }
};

export default function TechnicianProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [selectedLevelInfo, setSelectedLevelInfo] = useState<typeof COMPETENCY_LEVELS[0] | null>(null);

  // In real app, fetch tech by ID
  const tech = mockTechnician;
  const currentLevelInfo = COMPETENCY_LEVELS.find(l => l.level === tech.competency_level);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/technicians">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Technician Profile</h1>
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-[auto_1fr_auto] gap-8 items-start">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4" style={{ borderColor: tech.team_color }}>
                  {tech.profile_picture_url ? (
                    <AvatarImage src={tech.profile_picture_url} />
                  ) : (
                    <AvatarFallback
                      style={{ backgroundColor: tech.team_color + "20" }}
                      className="text-2xl font-bold"
                    >
                      {tech.initials.substring(0, 2)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">
                    {tech.first_name} {tech.last_name}
                  </h2>
                  {tech.assessment?.submitted_to_ecc && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className="mt-1 text-lg font-mono text-muted-foreground">
                  {tech.initials}
                </p>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: tech.team_color,
                      color: tech.team_color,
                    }}
                  >
                    {tech.team_name}
                  </Badge>
                  <Badge
                    style={{
                      backgroundColor: getVestasLevelColor(tech.vestas_level).bg,
                      color: getVestasLevelColor(tech.vestas_level).text,
                      borderColor: getVestasLevelColor(tech.vestas_level).border
                    }}
                  >
                    Vestas Level {tech.vestas_level}
                  </Badge>
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Email:</span> {tech.email}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {tech.phone}</p>
                </div>
              </div>

              {/* Competency Level Progression */}
              <div className="border-l pl-6 w-[300px]">
                <p className="text-xs font-medium text-muted-foreground mb-2">Competency Level</p>
                <div className="space-y-1.5">
                  {COMPETENCY_LEVELS.map((level) => {
                    const isActive = level.level === tech.competency_level;
                    const isPassed = level.level < tech.competency_level;

                    return (
                      <div
                        key={level.level}
                        className={`rounded-md px-2 py-1.5 transition-all ${
                          isActive
                            ? 'bg-blue-500/10 border-2 border-blue-500'
                            : isPassed
                            ? 'bg-green-500/5 border border-green-500/30'
                            : 'bg-muted/30 border border-muted-foreground/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-bold text-xs transition-all ${
                              isActive
                                ? 'bg-blue-500 border-blue-500 text-white'
                                : isPassed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                            }`}
                          >
                            {level.level}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs font-semibold truncate ${isActive ? 'text-blue-600' : isPassed ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {level.title}
                              </p>
                              <div className="flex items-center gap-1 shrink-0">
                                {isActive && (
                                  <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0">Now</Badge>
                                )}
                                {isPassed && (
                                  <span className="text-green-500 text-xs">✓</span>
                                )}
                                {/* Info Icon with hover and click */}
                                <div className="group/info relative">
                                  <button
                                    onClick={() => setSelectedLevelInfo(level)}
                                    className="p-0.5 hover:bg-accent rounded transition-colors"
                                  >
                                    <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                  </button>

                                  {/* Hover Tooltip on Icon */}
                                  <div className="invisible group-hover/info:visible absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg whitespace-normal">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Badge className="text-xs bg-primary shrink-0">Level {level.level}</Badge>
                                        <p className="text-xs font-bold leading-tight">{level.title}</p>
                                      </div>
                                      <p className="text-[10px] text-muted-foreground font-medium">{level.pointRange}</p>
                                      <p className="text-xs leading-relaxed">{level.description}</p>
                                      <p className="text-[10px] text-muted-foreground italic mt-2">Click for more details</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{level.pointRange}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {tech.assessment && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-[10px] text-muted-foreground">Total Points</p>
                    <p className="text-xl font-bold">{tech.assessment.total_points}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="kompetensmatris">Competency Matrix</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">First Name</p>
                      <p className="font-medium">{tech.first_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Name</p>
                      <p className="font-medium">{tech.last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Initials</p>
                      <p className="font-mono font-medium">{tech.initials}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Team</p>
                      <p className="font-medium">{tech.team_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-sm">{tech.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{tech.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Competency Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Competency Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Vestas Level</p>
                      <Badge
                        style={{
                          backgroundColor: getVestasLevelColor(tech.assessment.vestas_level).bg,
                          color: getVestasLevelColor(tech.assessment.vestas_level).text,
                          borderColor: getVestasLevelColor(tech.assessment.vestas_level).border
                        }}
                        className="text-lg px-3 py-1"
                      >
                        {tech.assessment.vestas_level}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Points</p>
                      <p className="text-2xl font-bold">{tech.assessment.total_points}</p>
                    </div>
                    <div className="group relative">
                      <p className="text-sm text-muted-foreground">Level</p>
                      <p className="text-2xl font-bold cursor-help">Level {tech.assessment.final_level}</p>
                      {COMPETENCY_LEVELS.find(l => l.level === tech.assessment.final_level) && (
                        <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-80 z-50 rounded-lg border bg-popover p-4 text-popover-foreground shadow-md">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className="text-sm">Level {COMPETENCY_LEVELS.find(l => l.level === tech.assessment.final_level)?.level}</Badge>
                              <p className="text-sm font-semibold">{COMPETENCY_LEVELS.find(l => l.level === tech.assessment.final_level)?.title}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{COMPETENCY_LEVELS.find(l => l.level === tech.assessment.final_level)?.pointRange}</p>
                            <p className="text-sm">{COMPETENCY_LEVELS.find(l => l.level === tech.assessment.final_level)?.description}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{tech.assessment.last_updated}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assessment History */}
            <AssessmentHistory technicianId={id} limit={5} />
          </TabsContent>

          <TabsContent value="kompetensmatris">
            <KompetensmatrisForm technicianId={id} initialData={tech.assessment} />
          </TabsContent>

          <TabsContent value="courses">
            <TrainingNeedsManager technicianId={id} />
          </TabsContent>

          <TabsContent value="vehicle">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Vehicle</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Vehicle assignment information
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Competency Level Info Dialog */}
      <Dialog open={!!selectedLevelInfo} onOpenChange={(open) => !open && setSelectedLevelInfo(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                {selectedLevelInfo?.level}
              </div>
              <div>
                <p className="text-xl font-bold">{selectedLevelInfo?.title}</p>
                <p className="text-sm text-muted-foreground font-normal">{selectedLevelInfo?.pointRange}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Description</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {selectedLevelInfo?.description}
              </p>
            </div>

            {/* Additional context based on level */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold">Responsibilities & Permissions</h4>
              <p className="text-sm text-muted-foreground">
                {selectedLevelInfo?.level === 1 && "At this level, technicians can only work under direct supervision of a Person in Charge. They are learning the fundamentals and building foundational skills."}
                {selectedLevelInfo?.level === 2 && "Technicians at this level can act as Person in Charge for mechanical work activities. They can perform mechanical lockouts but are not yet authorized for electrical lockouts."}
                {selectedLevelInfo?.level === 3 && "This level allows technicians to be Person in Charge for both mechanical and low voltage electrical lockouts. However, troubleshooting activities are still restricted."}
                {selectedLevelInfo?.level === 4 && "At this level, technicians have full authorization for mechanical and low voltage electrical work, including troubleshooting. This represents advanced operational capability."}
                {selectedLevelInfo?.level === 5 && "The highest competency level, authorizing technicians for all types of work including high voltage electrical systems and troubleshooting. Represents expert-level capability."}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
