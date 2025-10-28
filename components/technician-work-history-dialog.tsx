"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Briefcase, TrendingUp, Calendar, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTechnicianWorkHistory, TechnicianWorkHistory, TechnicianActivity } from "@/lib/technician-activity";
import { Technician } from "@/lib/technicians-data";

interface TechnicianWorkHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technician: Technician | null;
}

export function TechnicianWorkHistoryDialog({
  open,
  onOpenChange,
  technician,
}: TechnicianWorkHistoryDialogProps) {
  const [workHistory, setWorkHistory] = useState<TechnicianWorkHistory | null>(null);

  useEffect(() => {
    if (open && technician) {
      const history = getTechnicianWorkHistory(technician.id);
      setWorkHistory(history);
    }
  }, [open, technician]);

  if (!technician) return null;

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group activities by turbine/service
  const activitiesByService = workHistory?.activities.reduce((acc, activity) => {
    const key = `${activity.turbineModel}-${activity.serviceType}`;
    if (!acc[key]) {
      acc[key] = {
        turbineModel: activity.turbineModel,
        serviceType: activity.serviceType,
        activities: [],
        totalMinutes: 0,
      };
    }
    acc[key].activities.push(activity);
    acc[key].totalMinutes += activity.durationMinutes || 0;
    return acc;
  }, {} as Record<string, { turbineModel: string; serviceType: string; activities: TechnicianActivity[]; totalMinutes: number }>) || {};

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'T1': return 'bg-blue-500';
      case 'T2': return 'bg-purple-500';
      case 'T3': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="h-5 w-5 text-blue-600" />
            <span>
              {((technician as any).first_name ?? (technician as any).firstName ?? '')}
              {" "}
              {((technician as any).last_name ?? (technician as any).lastName ?? '')}
              <span className="text-sm text-muted-foreground ml-2">({technician.initials})</span>
            </span>
          </DialogTitle>
        </DialogHeader>

        {!workHistory || workHistory.activities.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No work history yet</p>
              <p className="text-xs text-muted-foreground mt-1">Activities will appear here once logged</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card className="p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Total Hours</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatDuration(workHistory.totalMinutesWorked)}
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Turbines</span>
                </div>
                <div className="text-2xl font-bold">
                  {workHistory.turbinesWorkedOn.length}
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Steps</span>
                </div>
                <div className="text-2xl font-bold">
                  {workHistory.stepsCompleted}
                </div>
              </Card>
            </div>

            {/* Activity Details */}
            <Tabs defaultValue="by-service" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="by-service">By Service</TabsTrigger>
                <TabsTrigger value="all">All Activities</TabsTrigger>
              </TabsList>

              {/* Grouped by Service */}
              <TabsContent value="by-service" className="flex-1 overflow-y-auto mt-3 space-y-3">
                {Object.entries(activitiesByService).map(([key, group]) => (
                  <Card key={key} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm">{group.turbineModel}</h3>
                        <p className="text-xs text-muted-foreground">{group.serviceType}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {formatDuration(group.totalMinutes)}
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      {group.activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-2 rounded bg-muted/50 text-xs"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge className={cn("text-[10px] px-1.5 py-0", getRoleColor(activity.technicianRole))}>
                                {activity.technicianRole}
                              </Badge>
                              <span className="font-medium">{activity.stepTitle.split('\n')[0]}</span>
                            </div>
                            {activity.checkInTime && (
                              <div className="text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {formatDate(activity.checkInTime)} {formatTime(activity.checkInTime)}
                                  {activity.checkOutTime && ` - ${formatTime(activity.checkOutTime)}`}
                                </span>
                              </div>
                            )}
                          </div>
                          {activity.durationMinutes && (
                            <div className="text-right">
                              <div className="font-semibold">{formatDuration(activity.durationMinutes)}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </TabsContent>

              {/* All Activities (chronological) */}
              <TabsContent value="all" className="flex-1 overflow-y-auto mt-3 space-y-2">
                {workHistory.activities
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((activity) => (
                    <Card key={activity.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={cn("text-[10px] px-1.5 py-0", getRoleColor(activity.technicianRole))}>
                              {activity.technicianRole}
                            </Badge>
                            <span className="font-semibold text-sm">{activity.turbineModel}</span>
                            <Badge variant="outline" className="text-[10px]">{activity.serviceType}</Badge>
                          </div>

                          <p className="text-sm font-medium mb-1">{activity.stepTitle.split('\n')[0]}</p>

                          {activity.checkInTime && (
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDate(activity.checkInTime)} {formatTime(activity.checkInTime)}
                                {activity.checkOutTime && ` - ${formatTime(activity.checkOutTime)}`}
                              </span>
                            </div>
                          )}

                          {activity.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{activity.notes}</p>
                          )}
                        </div>

                        {activity.durationMinutes && (
                          <div className="text-right ml-3">
                            <div className="text-lg font-bold">{formatDuration(activity.durationMinutes)}</div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
