"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Car, Users, Edit, Calendar } from "lucide-react";
import Link from "next/link";
import { use, useState, useEffect } from "react";
import { ALL_VEHICLES, ALL_TECHNICIANS, Vehicle, Technician } from "@/lib/mock-data";

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [mounted, setMounted] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    setMounted(true);
    const foundVehicle = ALL_VEHICLES.find(v => v.id === id);
    setVehicle(foundVehicle || null);
  }, [id]);

  if (!mounted) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading vehicle...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!vehicle) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/vehicles">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Vehicle Not Found</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">The requested vehicle could not be found.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Find assigned technicians
  const assignedTechs = ALL_TECHNICIANS.filter(tech =>
    vehicle.assigned_technicians.includes(tech.initials)
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/vehicles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Vehicle Details</h1>
        </div>

        {/* Vehicle Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted">
                <Car className="h-12 w-12 text-muted-foreground" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold font-mono">{vehicle.registration}</h2>
                </div>
                <p className="mt-1 text-lg text-muted-foreground">
                  {vehicle.make} {vehicle.model}
                </p>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: vehicle.team_color,
                      color: vehicle.team_color,
                    }}
                  >
                    {vehicle.team_name}
                  </Badge>
                  {vehicle.year && (
                    <Badge variant="secondary">
                      <Calendar className="mr-1 h-3 w-3" />
                      {vehicle.year}
                    </Badge>
                  )}
                </div>
              </div>

              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Vehicle
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Registration</p>
                  <p className="font-mono font-medium">{vehicle.registration}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Team</p>
                  <p className="font-medium">{vehicle.team_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Make</p>
                  <p className="font-medium">{vehicle.make || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{vehicle.model || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Year</p>
                  <p className="font-medium">{vehicle.year || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Technicians</p>
                  <p className="font-medium">{vehicle.assigned_technicians.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Technicians */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assigned Technicians</CardTitle>
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Manage
              </Button>
            </CardHeader>
            <CardContent>
              {assignedTechs.length > 0 ? (
                <div className="space-y-3">
                  {assignedTechs.map((tech) => (
                    <Link
                      key={tech.id}
                      href={`/technicians/${tech.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback
                          style={{ backgroundColor: tech.team_color + "20" }}
                          className="text-sm font-bold"
                        >
                          {tech.initials.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {tech.first_name} {tech.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {tech.initials}
                        </p>
                      </div>
                      {tech.vestas_level && (
                        <Badge variant="secondary">{tech.vestas_level}</Badge>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No technicians assigned to this vehicle.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Service History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Service history and maintenance records will be displayed here.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
