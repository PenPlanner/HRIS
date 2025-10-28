"use client"

import { MainLayout } from "@/components/layout/main-layout";
import Link from "next/link";
import { Users, GraduationCap, Settings as SettingsIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SeedDataButton } from "@/components/admin/seed-data-button";

export default function AdminPage() {
  return (
    <MainLayout>
      <div>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="mt-2 text-muted-foreground">
          Manage teams, courses, and system settings
        </p>

        {/* Development Tools */}
        <Card className="mt-6 border-dashed border-2 border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span>🛠️</span> Development Tools
            </CardTitle>
            <CardDescription>
              Tools for seeding test data and development utilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Work History Data</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Seed realistic work history data based on completed flowcharts.
                  Includes activities for multiple technicians with T3 trainees, varied times, and realistic scenarios.
                </p>
                <SeedDataButton />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link
            href="/admin/teams"
            className="rounded-lg border bg-card p-6 hover:bg-accent transition-colors"
          >
            <Users className="h-8 w-8 mb-2 text-primary" />
            <h2 className="text-xl font-semibold">Teams</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage teams, colors, and assignments
            </p>
          </Link>

          <Link
            href="/admin/courses"
            className="rounded-lg border bg-card p-6 hover:bg-accent transition-colors"
          >
            <GraduationCap className="h-8 w-8 mb-2 text-primary" />
            <h2 className="text-xl font-semibold">Courses</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage course catalog and categories
            </p>
          </Link>

          <Link
            href="/admin/settings"
            className="rounded-lg border bg-card p-6 hover:bg-accent transition-colors"
          >
            <SettingsIcon className="h-8 w-8 mb-2 text-primary" />
            <h2 className="text-xl font-semibold">Settings</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              System settings and configuration
            </p>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
