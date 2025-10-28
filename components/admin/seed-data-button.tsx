"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Droplet, Check, Loader2 } from "lucide-react";
import { seedWorkHistory } from "@/lib/seed-work-history";
import { getAllActivities } from "@/lib/technician-activity";

export function SeedDataButton() {
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [activityCount, setActivityCount] = useState(0);

  const handleSeed = () => {
    setSeeding(true);

    // Run seed function
    try {
      seedWorkHistory();

      // Get count of activities
      const activities = getAllActivities();
      setActivityCount(activities.length);

      setSeeded(true);
      setTimeout(() => setSeeded(false), 3000);
    } catch (error) {
      console.error('Failed to seed data:', error);
    } finally {
      setSeeding(false);
    }
  };

  const handleCheck = () => {
    const activities = getAllActivities();
    setActivityCount(activities.length);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleSeed}
        disabled={seeding || seeded}
        size="sm"
        variant="outline"
        className="gap-2"
      >
        {seeding ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Seeding...
          </>
        ) : seeded ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            Data Seeded!
          </>
        ) : (
          <>
            <Droplet className="h-4 w-4" />
            Seed Work History
          </>
        )}
      </Button>

      <Button
        onClick={handleCheck}
        size="sm"
        variant="ghost"
        className="gap-2"
      >
        Check Data
      </Button>

      {activityCount > 0 && (
        <Badge variant="secondary">
          {activityCount} activities in storage
        </Badge>
      )}
    </div>
  );
}
