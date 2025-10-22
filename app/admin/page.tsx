import { MainLayout } from "@/components/layout/main-layout";
import Link from "next/link";
import { Users, GraduationCap, Settings as SettingsIcon } from "lucide-react";

export default function AdminPage() {
  return (
    <MainLayout>
      <div>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="mt-2 text-muted-foreground">
          Manage teams, courses, and system settings
        </p>

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
