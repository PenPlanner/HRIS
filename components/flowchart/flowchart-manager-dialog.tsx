"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FlowchartData,
  generateFlowchartId,
  loadCustomFlowcharts,
  deleteFlowchart,
  exportFlowchartJSON,
  importFlowchartJSON,
  saveFlowchart
} from "@/lib/flowchart-data";
import { Plus, Trash2, Download, Upload, Copy, FileText, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface FlowchartManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

export function FlowchartManagerDialog({ open, onOpenChange, onRefresh }: FlowchartManagerDialogProps) {
  const router = useRouter();
  const [customFlowcharts, setCustomFlowcharts] = useState<FlowchartData[]>(loadCustomFlowcharts());
  const [showNewForm, setShowNewForm] = useState(false);
  const [newModel, setNewModel] = useState("");
  const [newServiceType, setNewServiceType] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refreshList = () => {
    setCustomFlowcharts(loadCustomFlowcharts());
    onRefresh?.();
  };

  const handleCreateNew = () => {
    if (!newModel.trim() || !newServiceType.trim()) {
      setError("Please fill in both model and service type");
      return;
    }

    const newFlowchart: FlowchartData = {
      id: generateFlowchartId(newModel, newServiceType),
      model: newModel,
      serviceType: newServiceType,
      optimizedSIF: "Custom",
      referenceDocument: "User Created",
      revisionDate: new Date().toLocaleDateString(),
      technicians: 2,
      totalTime: "0m",
      totalMinutes: 0,
      workHours: "0:00h",
      duration: "0:00h",
      steps: [],
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    saveFlowchart(newFlowchart);
    refreshList();

    // Navigate to the new flowchart in edit mode
    const modelId = newModel.toLowerCase().replace(/\s+/g, "-");
    router.push(`/flowcharts/${modelId}/${newFlowchart.id}`);

    setShowNewForm(false);
    setNewModel("");
    setNewServiceType("");
    setError(null);
    onOpenChange(false);
  };

  const handleDelete = (flowchartId: string) => {
    if (confirm("Are you sure you want to delete this flowchart? This cannot be undone.")) {
      deleteFlowchart(flowchartId);
      refreshList();
    }
  };

  const handleDuplicate = (flowchart: FlowchartData) => {
    const duplicated: FlowchartData = {
      ...flowchart,
      id: generateFlowchartId(flowchart.model, `${flowchart.serviceType} (Copy)`),
      serviceType: `${flowchart.serviceType} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: undefined
    };

    saveFlowchart(duplicated);
    refreshList();
  };

  const handleExport = (flowchart: FlowchartData) => {
    exportFlowchartJSON(flowchart);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const flowchart = await importFlowchartJSON(file);
      saveFlowchart(flowchart);
      refreshList();
      setError(null);
    } catch (err) {
      setError(`Failed to import: ${err instanceof Error ? err.message : "Unknown error"}`);
    }

    // Reset file input
    e.target.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Flowcharts</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={() => setShowNewForm(!showNewForm)} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              New Flowchart
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <label>
                <Upload className="h-4 w-4 mr-2" />
                Import JSON
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </Button>
          </div>

          {/* New Flowchart Form */}
          {showNewForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create New Flowchart</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-model">Turbine Model</Label>
                    <Input
                      id="new-model"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      placeholder="e.g., EnVentus Mk 0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-service">Service Type</Label>
                    <Input
                      id="new-service"
                      value={newServiceType}
                      onChange={(e) => setNewServiceType(e.target.value)}
                      placeholder="e.g., 1Y Service"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowNewForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNew}>
                    Create & Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Custom Flowcharts List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Your Custom Flowcharts ({customFlowcharts.length})</h3>
            </div>

            {customFlowcharts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 pb-6 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No custom flowcharts yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a new flowchart or import from PDF/JSON
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {customFlowcharts.map((flowchart) => (
                  <Card key={flowchart.id} className="hover:bg-accent transition-colors">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{flowchart.model}</h4>
                            <Badge variant="outline">{flowchart.serviceType}</Badge>
                            {flowchart.isCustom && (
                              <Badge variant="secondary" className="text-xs">Custom</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <p>{flowchart.steps.length} steps • {flowchart.totalTime}</p>
                            {flowchart.createdAt && (
                              <p className="text-xs">
                                Created: {new Date(flowchart.createdAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const modelId = flowchart.model.toLowerCase().replace(/\s+/g, "-");
                                router.push(`/flowcharts/${modelId}/${flowchart.id}`);
                                onOpenChange(false);
                              }}
                              className="h-8"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Open
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDuplicate(flowchart)}
                              className="h-8"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Duplicate
                            </Button>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExport(flowchart)}
                              className="h-8"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Export
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(flowchart.id)}
                              className="h-8 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
