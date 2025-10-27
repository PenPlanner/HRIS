"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Search, Wind, Clock, Users, FileText, Plus, Settings, FileUp, CheckCircle2, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getAllFlowcharts } from "@/lib/flowchart-data";
import { FlowchartManagerDialog } from "@/components/flowchart/flowchart-manager-dialog";
import { getCompletedFlowchartsSorted, formatDuration } from "@/lib/completed-flowcharts";

// Dynamically import PDFImportDialog to avoid SSR issues with pdfjs-dist
const PDFImportDialog = dynamic(
  () => import("@/components/flowchart/pdf-import-dialog").then(mod => mod.PDFImportDialog),
  { ssr: false }
);

export default function FlowchartsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allModels, setAllModels] = useState(getAllFlowcharts());
  const [managerOpen, setManagerOpen] = useState(false);
  const [pdfImportOpen, setPdfImportOpen] = useState(false);
  const [completedFlowcharts, setCompletedFlowcharts] = useState(getCompletedFlowchartsSorted());

  const refreshFlowcharts = () => {
    setAllModels(getAllFlowcharts());
    setCompletedFlowcharts(getCompletedFlowchartsSorted());
  };

  // Refresh completed flowcharts on mount and when tab changes
  useEffect(() => {
    setCompletedFlowcharts(getCompletedFlowchartsSorted());
  }, []);

  const filteredModels = allModels.filter(model => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return model.name.toLowerCase().includes(query) ||
           model.flowcharts.some(f => f.serviceType.toLowerCase().includes(query));
  });

  const filteredCompletedFlowcharts = completedFlowcharts.filter(cf => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return cf.flowchartData.model.toLowerCase().includes(query) ||
           cf.flowchartData.serviceType.toLowerCase().includes(query);
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Service Flowcharts</h1>
            <p className="mt-2 text-muted-foreground">
              Interactive service procedure flowcharts for wind turbines
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setPdfImportOpen(true)} variant="outline">
              <FileUp className="h-4 w-4 mr-2" />
              Import PDF
            </Button>
            <Button onClick={() => setManagerOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Models</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wind className="h-5 w-5 text-primary" />
                <p className="text-3xl font-bold">{allModels.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Flowcharts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <p className="text-3xl font-bold">
                  {allModels.reduce((sum, model) => sum + model.flowcharts.length, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Service Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <p className="text-3xl font-bold">1Y, 3Y, 5Y</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Technicians</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <p className="text-3xl font-bold">2</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by turbine model or service type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Active and Completed Flowcharts */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">
              <FileText className="h-4 w-4 mr-2" />
              Active Flowcharts
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Completed ({completedFlowcharts.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Flowcharts Tab */}
          <TabsContent value="active" className="space-y-8">
            {/* Models Grid */}
        <div className="space-y-8">
          {filteredModels.map((model) => (
            <div key={model.id}>
              <div className="flex items-center gap-3 mb-4">
                <Wind className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">{model.name}</h2>
                <Badge variant="secondary">{model.flowcharts.length} flowcharts</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {model.flowcharts.map((flowchart) => (
                  <Link
                    key={flowchart.id}
                    href={`/flowcharts/${model.id}/${flowchart.id}`}
                  >
                    <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{flowchart.serviceType}</CardTitle>
                          <Badge variant="outline">{flowchart.steps.length} steps</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{flowchart.technicians} Technicians</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Duration: {flowchart.duration}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>Total: {flowchart.totalTime}</span>
                          </div>
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-xs text-muted-foreground">
                              SIF: {flowchart.optimizedSIF}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Rev: {flowchart.revisionDate}
                            </p>
                          </div>
                        </div>
                        <Button className="w-full mt-4" size="sm">
                          Open Flowchart
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

            {filteredModels.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No flowcharts found matching your search</p>
              </div>
            )}
          </TabsContent>

          {/* Completed Flowcharts Tab */}
          <TabsContent value="completed" className="space-y-4">
            {filteredCompletedFlowcharts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No completed flowcharts yet</p>
              </div>
            ) : (
              filteredCompletedFlowcharts.map((cf) => (
                <Card key={cf.id} className="hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          {cf.flowchartData.model} - {cf.flowchartData.serviceType}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Completed {new Date(cf.completedAt).toLocaleDateString('sv-SE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Badge
                        variant={cf.summary.timeVariance < 0 ? "default" : "destructive"}
                        className="flex items-center gap-1"
                      >
                        {cf.summary.timeVariance < 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {cf.summary.timeVariance < 0 ? '-' : '+'}{formatDuration(Math.abs(cf.summary.timeVariance))}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      {/* Technicians */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Technicians</p>
                        <div className="flex gap-1">
                          {cf.technicians.t1 && (
                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700 border-blue-300">
                              T1: {cf.technicians.t1.initials}
                            </Badge>
                          )}
                          {cf.technicians.t2 && (
                            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-700 border-purple-300">
                              T2: {cf.technicians.t2.initials}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Time Stats */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Time</p>
                        <p className="text-sm font-semibold">
                          {formatDuration(cf.summary.actualTimeMinutes)} / {formatDuration(cf.summary.targetTimeMinutes)}
                        </p>
                      </div>

                      {/* Tasks Stats */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tasks</p>
                        <p className="text-sm font-semibold">
                          {cf.summary.completedTasks}/{cf.summary.totalTasks} ({Math.round((cf.summary.completedTasks / cf.summary.totalTasks) * 100)}%)
                        </p>
                      </div>

                      {/* Notes Stats */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm font-semibold">{cf.summary.totalNotes} notes</p>
                      </div>
                    </div>

                    {/* Steps with technician info */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2 font-semibold">Completed Steps:</p>
                      <div className="flex flex-wrap gap-1">
                        {cf.steps.filter(step => step.completedAt).map(step => (
                          <Badge
                            key={step.id}
                            variant="outline"
                            className="text-xs"
                            style={{
                              backgroundColor: step.completedByInitials ? (step.technician === "T1" ? '#3b82f620' : '#a855f720') : undefined
                            }}
                          >
                            {step.title} {step.completedByInitials && `(${step.completedByInitials})`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Flowchart Manager Dialog */}
      <FlowchartManagerDialog
        open={managerOpen}
        onOpenChange={setManagerOpen}
        onRefresh={refreshFlowcharts}
      />

      {/* PDF Import Dialog */}
      <PDFImportDialog
        open={pdfImportOpen}
        onOpenChange={setPdfImportOpen}
        onImport={(flowchart) => {
          setPdfImportOpen(false);
          refreshFlowcharts();
        }}
      />
    </MainLayout>
  );
}
