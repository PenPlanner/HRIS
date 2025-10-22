"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import {
  Building2,
  Database,
  Bell,
  Palette,
  Download,
  Upload,
  Save,
  CheckCircle
} from "lucide-react";

type SystemSettings = {
  organization_name: string;
  contact_email: string;
  contact_phone: string;
  timezone: string;
  date_format: string;
  items_per_page: number;
  enable_notifications: boolean;
  auto_backup_enabled: boolean;
  backup_frequency: string;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    organization_name: "Vestas Wind Systems",
    contact_email: "hr@vestas.com",
    contact_phone: "+46 123 456 789",
    timezone: "Europe/Stockholm",
    date_format: "YYYY-MM-DD",
    items_per_page: 25,
    enable_notifications: true,
    auto_backup_enabled: false,
    backup_frequency: "weekly",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem("system_settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem("system_settings", JSON.stringify(settings));
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 500);
  };

  const handleExportData = () => {
    // Export all data to JSON
    const allData = {
      settings,
      teams: JSON.parse(localStorage.getItem("teams") || "[]"),
      courses: JSON.parse(localStorage.getItem("courses") || "[]"),
      vehicles: JSON.parse(localStorage.getItem("vehicles") || "[]"),
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hris-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (confirm("This will overwrite all current data. Are you sure?")) {
          if (data.settings) localStorage.setItem("system_settings", JSON.stringify(data.settings));
          if (data.teams) localStorage.setItem("teams", JSON.stringify(data.teams));
          if (data.courses) localStorage.setItem("courses", JSON.stringify(data.courses));
          if (data.vehicles) localStorage.setItem("vehicles", JSON.stringify(data.vehicles));

          alert("Data imported successfully! Please refresh the page.");
        }
      } catch (error) {
        alert("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (confirm("This will delete ALL data (teams, courses, vehicles). This cannot be undone. Are you sure?")) {
      if (confirm("Are you REALLY sure? This is permanent!")) {
        localStorage.clear();
        alert("All data has been cleared. Please refresh the page.");
      }
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Settings</h1>
            <p className="mt-2 text-muted-foreground">
              Configure system preferences and data management
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isSaving ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Save className="h-4 w-4 animate-pulse" />
                Saving...
              </div>
            ) : lastSaved ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            ) : null}
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>

        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Organization Settings</CardTitle>
            </div>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org_name">Organization Name</Label>
                <Input
                  id="org_name"
                  value={settings.organization_name}
                  onChange={(e) => setSettings({ ...settings, organization_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Europe/Stockholm">Europe/Stockholm (CET/CEST)</option>
                  <option value="Europe/Copenhagen">Europe/Copenhagen</option>
                  <option value="Europe/Oslo">Europe/Oslo</option>
                  <option value="Europe/Helsinki">Europe/Helsinki</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Display Settings</CardTitle>
            </div>
            <CardDescription>
              Customize how data is displayed in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date_format">Date Format</Label>
                <select
                  id="date_format"
                  value={settings.date_format}
                  onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2025-10-21)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (21/10/2025)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (10/21/2025)</option>
                  <option value="DD MMM YYYY">DD MMM YYYY (21 Oct 2025)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="items_per_page">Items Per Page</Label>
                <select
                  id="items_per_page"
                  value={settings.items_per_page}
                  onChange={(e) => setSettings({ ...settings, items_per_page: parseInt(e.target.value) })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>
              Manage system notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive alerts for expiring certifications and training needs
                </p>
              </div>
              <Button
                variant={settings.enable_notifications ? "default" : "outline"}
                onClick={() => setSettings({ ...settings, enable_notifications: !settings.enable_notifications })}
              >
                {settings.enable_notifications ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Data Management</CardTitle>
            </div>
            <CardDescription>
              Backup, restore, and manage your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto Backup */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">Automatic Backups</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically backup data to Supabase
                  </p>
                </div>
                <Button
                  variant={settings.auto_backup_enabled ? "default" : "outline"}
                  onClick={() => setSettings({ ...settings, auto_backup_enabled: !settings.auto_backup_enabled })}
                >
                  {settings.auto_backup_enabled ? "Enabled" : "Disabled"}
                </Button>
              </div>
              {settings.auto_backup_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="backup_frequency">Backup Frequency</Label>
                  <select
                    id="backup_frequency"
                    value={settings.backup_frequency}
                    onChange={(e) => setSettings({ ...settings, backup_frequency: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
            </div>

            {/* Export/Import */}
            <div className="border-t pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2">Export Data</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Download all data as JSON backup file
                  </p>
                  <Button onClick={handleExportData} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export All Data
                  </Button>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Import Data</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Restore data from backup file
                  </p>
                  <label htmlFor="import-file" className="cursor-pointer">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Import Backup
                      </span>
                    </Button>
                  </label>
                  <input
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-destructive/30 pt-6">
              <div className="rounded-lg border-2 border-destructive/50 bg-destructive/5 p-4">
                <h3 className="font-medium text-destructive mb-2">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete all data from localStorage. This action cannot be undone.
                </p>
                <Button variant="destructive" onClick={handleClearData}>
                  Clear All Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Current system status and version info
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="font-medium">1.0.0 (Development)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Database</p>
                <p className="font-medium">localStorage (Temporary)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Backend Status</p>
                <Badge variant="outline" className="text-yellow-600">
                  Not Connected
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">2025-10-21</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> The system is currently using localStorage for data storage.
                Connect to Supabase for production use with real-time updates, authentication, and persistent storage.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
