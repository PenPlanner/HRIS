"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlowchartData } from "@/lib/flowchart-data";
import { SERVICE_TYPE_COLORS } from "@/lib/service-colors";
import { Users, Clock, Timer } from "lucide-react";

interface FlowchartInfoCardProps {
  flowchart: FlowchartData;
}

export function FlowchartInfoCard({ flowchart }: FlowchartInfoCardProps) {
  // Format minutes to hh:mm format
  const formatToHHMM = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}h`;
  };

  // Format to "h o m" format (e.g., "38h 0m")
  const formatToHM = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Calculate duration from totalMinutes and number of technicians
  const durationMinutes = flowchart.totalMinutes / flowchart.technicians;
  const durationFormatted = formatToHHMM(Math.round(durationMinutes));

  return (
    <Card className="w-[350px] shadow-lg border-2">
      <CardHeader className="pb-3 bg-blue-600">
        <CardTitle className="text-base font-bold text-white">{flowchart.model}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {/* Info Table */}
        <div className="space-y-2 text-sm">
          <div className="border-b pb-2">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span>No. of Technicians</span>
            </div>
            <div className="flex items-center gap-2 ml-6">
              {flowchart.technicians === 2 ? (
                <>
                  <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                    <Users className="h-3 w-3" />
                    <span>T1</span>
                  </div>
                  <div className="flex items-center gap-1 bg-purple-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                    <Users className="h-3 w-3" />
                    <span>T2</span>
                  </div>
                </>
              ) : (
                <span className="font-bold">{flowchart.technicians}</span>
              )}
            </div>
          </div>

          <div className="border-b pb-2">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <Timer className="h-4 w-4 text-green-600" />
              <span>Work [min]</span>
            </div>
            <div className="text-xs text-muted-foreground mb-1 ml-6">
              Total time in turbine to complete service (for all service technicians)
            </div>
            <div className="font-bold ml-6">{flowchart.totalMinutes}m</div>
          </div>

          <div className="border-b pb-2">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <Clock className="h-4 w-4 text-orange-600" />
              <span>Work [h o m]</span>
            </div>
            <div className="font-bold ml-6">{formatToHM(flowchart.totalMinutes)}</div>
          </div>

          <div>
            <div className="flex items-center gap-2 font-semibold mb-1">
              <Clock className="h-4 w-4 text-red-600" />
              <span>Duration [hh:mm]</span>
            </div>
            <div className="text-xs text-muted-foreground mb-1 ml-6">
              Time in turbine of one service technician (turbine downtime)
            </div>
            <div className="font-bold ml-6">{durationFormatted}</div>
          </div>
        </div>

        {/* Service Type Legend */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-4 gap-2">
            {[
              { code: "1Y", label: "1Y" },
              { code: "2Y", label: "2Y" },
              { code: "4Y", label: "4Y" },
              { code: "6Y", label: "6Y" },
              { code: "3Y", label: "3Y" },
              { code: "5Y", label: "5Y" },
              { code: "7Y", label: "7Y" },
              { code: "10Y", label: "10Y" },
            ].map(({ code, label }) => (
              <div
                key={code}
                className="flex items-center justify-center px-2 py-1.5 rounded font-bold text-xs"
                style={{
                  backgroundColor: SERVICE_TYPE_COLORS[code as keyof typeof SERVICE_TYPE_COLORS],
                  color: code === "7Y" || code === "10Y" ? "black" : "white"
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div
              className="flex items-center justify-center px-2 py-1.5 rounded font-bold text-xs"
              style={{
                backgroundColor: SERVICE_TYPE_COLORS["12Y"],
                color: "white"
              }}
            >
              12Y
            </div>
            <div
              className="flex items-center justify-center px-2 py-1.5 rounded font-bold text-xs"
              style={{
                backgroundColor: SERVICE_TYPE_COLORS["All"],
                color: "white"
              }}
            >
              Ext
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
