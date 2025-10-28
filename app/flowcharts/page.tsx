"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Search, Wind, Clock, Users, FileText, Plus, Settings, FileUp, CheckCircle2, Calendar, TrendingUp, TrendingDown, Bug, AlertCircle, CheckCircle, Eye } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getAllFlowcharts } from "@/lib/flowchart-data";
import { FlowchartManagerDialog } from "@/components/flowchart/flowchart-manager-dialog";
import { getCompletedFlowchartsSorted, formatDuration, getAllBugs, updateBugStatus } from "@/lib/completed-flowcharts";
import { seedCompletedFlowcharts } from "@/lib/seed-completed-flowcharts";

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
  const [allBugs, setAllBugs] = useState(getAllBugs());

  const refreshFlowcharts = () => {
    setAllModels(getAllFlowcharts());
    setCompletedFlowcharts(getCompletedFlowchartsSorted());
    setAllBugs(getAllBugs());
  };

  // Seed example data and refresh on mount
  useEffect(() => {
    seedCompletedFlowcharts();
    setCompletedFlowcharts(getCompletedFlowchartsSorted());
    setAllBugs(getAllBugs());
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
           cf.flowchartData.serviceType.toLowerCase().includes(query) ||
           cf.wtgNumber.includes(query);
  });

  const filteredBugs = allBugs.filter(bug => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return bug.title.toLowerCase().includes(query) ||
           bug.description.toLowerCase().includes(query) ||
           bug.wtgNumber.includes(query) ||
           bug.flowchartName.toLowerCase().includes(query);
  });

  // Bug statistics
  const bugStats = {
    total: allBugs.length,
    open: allBugs.filter(b => b.status === 'open').length,
    investigating: allBugs.filter(b => b.status === 'investigating').length,
    crushed: allBugs.filter(b => b.status === 'crushed').length
  };

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
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Models</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{allModels.length}</p>
                </div>
                <Wind className="h-12 w-12 text-blue-500 dark:text-blue-400 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Flowcharts</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                    {allModels.reduce((sum, model) => sum + model.flowcharts.length, 0)}
                  </p>
                </div>
                <FileText className="h-12 w-12 text-purple-500 dark:text-purple-400 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/30 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Completed</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">{completedFlowcharts.length}</p>
                </div>
                <CheckCircle2 className="h-12 w-12 text-green-500 dark:text-green-400 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/30 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Total Bugs</p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-100 mt-1">{bugStats.total}</p>
                </div>
                <Bug className="h-12 w-12 text-amber-500 dark:text-amber-400 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950 dark:to-red-900/30 border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Open Bugs</p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-1">{bugStats.open}</p>
                </div>
                <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 opacity-60" />
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

        {/* Tabs for Active, Completed, and Bugs */}
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
            <TabsTrigger value="bugs">
              <Bug className="h-4 w-4 mr-2" />
              Bugs ({bugStats.total})
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
                    <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full border-2 hover:border-blue-500/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {flowchart.serviceType}
                          </CardTitle>
                          <Badge variant="secondary" className="font-mono text-xs">
                            {flowchart.steps.length} steps
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Technicians</p>
                              <p className="font-semibold">{flowchart.technicians}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Downtime</p>
                              <p className="font-semibold">{flowchart.duration}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium">Total Time: {flowchart.totalTime}</span>
                        </div>

                        <div className="pt-3 border-t space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">SIF:</span>
                            <span className="font-mono font-semibold">{flowchart.optimizedSIF}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Revision:</span>
                            <span className="font-mono font-semibold">{flowchart.revisionDate}</span>
                          </div>
                        </div>

                        <Button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" size="sm">
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
                          <Badge variant="secondary" className="ml-2 font-mono text-sm">
                            WTG-{cf.wtgNumber}
                          </Badge>
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
                    <div className="grid md:grid-cols-5 gap-4">
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

                      {/* Bugs Stats */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bugs</p>
                        <div className="flex gap-1">
                          {cf.summary.totalBugs > 0 ? (
                            <>
                              <Badge variant="destructive" className="text-xs">{cf.summary.openBugs} open</Badge>
                              <Badge variant="secondary" className="text-xs">{cf.summary.crushedBugs} fixed</Badge>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">None</p>
                          )}
                        </div>
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

          {/* Bugs Tab */}
          <TabsContent value="bugs" className="space-y-4">
            {/* Bug Stats Summary */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Bugs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Bug className="h-5 w-5 text-orange-500" />
                    <p className="text-3xl font-bold">{bugStats.total}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-3xl font-bold">{bugStats.open}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Investigating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-yellow-500" />
                    <p className="text-3xl font-bold">{bugStats.investigating}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Crushed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="text-3xl font-bold">{bugStats.crushed}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {filteredBugs.length === 0 ? (
              <div className="text-center py-12">
                <Bug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No bugs reported yet</p>
              </div>
            ) : (
              filteredBugs.map((bug) => (
                <Card key={bug.id} className="hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{bug.title}</CardTitle>
                          <Badge
                            variant={
                              bug.status === 'open' ? 'destructive' :
                              bug.status === 'investigating' ? 'default' :
                              'secondary'
                            }
                            className="flex items-center gap-1"
                          >
                            {bug.status === 'open' && <AlertCircle className="h-3 w-3" />}
                            {bug.status === 'investigating' && <Eye className="h-3 w-3" />}
                            {bug.status === 'crushed' && <CheckCircle className="h-3 w-3" />}
                            {bug.status.charAt(0).toUpperCase() + bug.status.slice(1)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              bug.severity === 'critical' ? 'bg-red-500/10 text-red-700 border-red-300' :
                              bug.severity === 'high' ? 'bg-orange-500/10 text-orange-700 border-orange-300' :
                              bug.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-300' :
                              'bg-blue-500/10 text-blue-700 border-blue-300'
                            }
                          >
                            {bug.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {bug.flowchartName} • WTG-{bug.wtgNumber}
                        </p>
                      </div>
                      {bug.status !== 'crushed' && (
                        <div className="flex gap-2">
                          {bug.status === 'open' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                updateBugStatus(bug.id, 'investigating');
                                refreshFlowcharts();
                              }}
                            >
                              Start Investigation
                            </Button>
                          )}
                          {bug.status === 'investigating' && (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                updateBugStatus(bug.id, 'crushed', 'System');
                                refreshFlowcharts();
                              }}
                            >
                              Mark as Crushed
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{bug.description}</p>

                    <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Reported</p>
                        <p className="text-sm font-medium">
                          {new Date(bug.reportedAt).toLocaleDateString('sv-SE', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {bug.reportedBy && (
                          <p className="text-xs text-muted-foreground">by {bug.reportedBy}</p>
                        )}
                      </div>

                      {bug.status === 'crushed' && bug.resolvedAt && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Resolved</p>
                          <p className="text-sm font-medium text-green-600">
                            {new Date(bug.resolvedAt).toLocaleDateString('sv-SE', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {bug.resolvedBy && (
                            <p className="text-xs text-muted-foreground">by {bug.resolvedBy}</p>
                          )}
                        </div>
                      )}

                      {bug.notes && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm">{bug.notes}</p>
                        </div>
                      )}
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
