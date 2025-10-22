"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

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

export type Technician = {
  id: string;
  first_name: string;
  last_name: string;
  initials: string;
  team_id: string;
  team_name: string;
  team_color: string;
  profile_picture_url?: string;
  email?: string;
  phone?: string;
  vestas_level?: VestasLevel;
  competency_level?: number; // 1-5
};

const mockTechnicians: Technician[] = [
  {
    id: "1",
    first_name: "Markus",
    last_name: "Anderson",
    initials: "MRADR",
    team_id: "1",
    team_name: "Travel S",
    team_color: "#06b6d4",
    email: "markus.anderson@example.com",
    vestas_level: "B",
    competency_level: 4,
  },
  {
    id: "2",
    first_name: "Carl Emil",
    last_name: "Gryme",
    initials: "CLEGR",
    team_id: "1",
    team_name: "Travel S",
    team_color: "#06b6d4",
    email: "carl.gryme@example.com",
    vestas_level: "C",
    competency_level: 3,
  },
  {
    id: "3",
    first_name: "Andreas",
    last_name: "Larsson",
    initials: "ANLRN",
    team_id: "2",
    team_name: "Travel U",
    team_color: "#0ea5e9",
    email: "andreas.larsson@example.com",
    vestas_level: "A",
    competency_level: 5,
  },
];

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>(mockTechnicians);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("technicians");
    if (saved) {
      setTechnicians(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("technicians", JSON.stringify(technicians));
  }, [technicians]);

  const filteredTechnicians = technicians.filter((tech) => {
    const query = searchQuery.toLowerCase();
    return (
      tech.initials.toLowerCase().includes(query) ||
      tech.first_name.toLowerCase().includes(query) ||
      tech.last_name.toLowerCase().includes(query) ||
      tech.team_name.toLowerCase().includes(query)
    );
  });

  const getLevelColor = (level?: number) => {
    if (!level) return "bg-gray-500";
    if (level === 5) return "bg-green-500";
    if (level === 4) return "bg-blue-500";
    if (level === 3) return "bg-yellow-500";
    if (level === 2) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Technicians</h1>
            <p className="mt-2 text-muted-foreground">
              {filteredTechnicians.length} technicians
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Technician
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by initials, name, or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTechnicians.map((tech) => (
            <Link
              key={tech.id}
              href={`/technicians/${tech.id}`}
              className="rounded-lg border bg-card p-4 hover:bg-accent transition-colors"
              style={{ borderLeft: `4px solid ${tech.team_color}` }}
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  {tech.profile_picture_url ? (
                    <AvatarImage src={tech.profile_picture_url} />
                  ) : (
                    <AvatarFallback
                      style={{ backgroundColor: tech.team_color + "20" }}
                      className="text-sm font-bold"
                    >
                      {tech.initials.substring(0, 2)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">
                      {tech.first_name} {tech.last_name}
                    </h3>
                  </div>
                  <p className="text-sm font-mono text-muted-foreground">
                    {tech.initials}
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: tech.team_color,
                        color: tech.team_color,
                      }}
                    >
                      {tech.team_name}
                    </Badge>
                    {tech.vestas_level && (
                      <Badge
                        style={{
                          backgroundColor: getVestasLevelColor(tech.vestas_level).bg,
                          color: getVestasLevelColor(tech.vestas_level).text,
                          borderColor: getVestasLevelColor(tech.vestas_level).border
                        }}
                      >
                        {tech.vestas_level}
                      </Badge>
                    )}
                    {tech.competency_level && (
                      <Badge
                        className={`${getLevelColor(tech.competency_level)} text-white`}
                      >
                        L{tech.competency_level}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredTechnicians.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No technicians found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
