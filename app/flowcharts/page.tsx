"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Search, Wind, Clock, Users, FileText, Plus, Settings, FileUp } from "lucide-react";
import Link from "next/link";
import { getAllFlowcharts } from "@/lib/flowchart-data";
import { FlowchartManagerDialog } from "@/components/flowchart/flowchart-manager-dialog";
import { PDFImportDialog } from "@/components/flowchart/pdf-import-dialog";

export default function FlowchartsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allModels, setAllModels] = useState(getAllFlowcharts());
  const [managerOpen, setManagerOpen] = useState(false);
  const [pdfImportOpen, setPdfImportOpen] = useState(false);

  const refreshFlowcharts = () => {
    setAllModels(getAllFlowcharts());
  };

  const filteredModels = allModels.filter(model => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return model.name.toLowerCase().includes(query) ||
           model.flowcharts.some(f => f.serviceType.toLowerCase().includes(query));
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
