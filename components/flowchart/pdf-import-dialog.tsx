"use client"

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FlowchartData, FlowchartStep, generateFlowchartId, generateStepId, generateTaskId } from "@/lib/flowchart-data";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface PDFImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (flowchart: FlowchartData) => void;
}

interface ParsedData {
  model: string;
  serviceType: string;
  steps: Array<{
    title: string;
    duration: string;
    colorCode?: string;
    technician?: "T1" | "T2" | "both";
    tasks: string[];
  }>;
}

export function PDFImportDialog({ open, onOpenChange, onImport }: PDFImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [model, setModel] = useState("");
  const [serviceType, setServiceType] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please select a valid PDF file");
    }
  };

  const extractTextFromPDF = async (pdfFile: File): Promise<string> => {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  };

  const parseFlowchartData = (text: string): ParsedData => {
    // This is a basic parser - can be enhanced based on specific PDF format
    const lines = text.split("\n").filter(line => line.trim());

    // Try to find model and service type
    let detectedModel = model;
    let detectedServiceType = serviceType;

    // Look for common turbine model patterns
    const modelMatch = text.match(/(?:EnVentus|Vestas|Siemens|GE)\s*(?:Mk\s*\d+|V\d+)?/i);
    if (modelMatch && !detectedModel) {
      detectedModel = modelMatch[0];
    }

    // Look for service type patterns
    const serviceMatch = text.match(/(\d+Y?\s*Service|Annual\s*Service|Semi-Annual)/i);
    if (serviceMatch && !detectedServiceType) {
      detectedServiceType = serviceMatch[0];
    }

    // Parse steps - look for numbered items or bullet points
    const steps: ParsedData["steps"] = [];
    let currentStep: ParsedData["steps"][0] | null = null;

    for (const line of lines) {
      // Check if line starts a new step (numbered or with duration)
      const stepMatch = line.match(/^(\d+\.?|\•|\-)\s*(.+)/);
      const durationMatch = line.match(/(\d+m|\d+\s*min)/i);

      if (stepMatch || (durationMatch && line.length < 100)) {
        if (currentStep) {
          steps.push(currentStep);
        }

        const title = stepMatch ? stepMatch[2] : line;
        const duration = durationMatch ? durationMatch[0].replace(/\s/g, "") : "60m";

        // Try to detect technician from common patterns
        let technician: "T1" | "T2" | "both" = "both";
        if (/T1|Tech\s*1|Technician\s*1/i.test(line)) technician = "T1";
        if (/T2|Tech\s*2|Technician\s*2/i.test(line)) technician = "T2";
        if (/both|all|together/i.test(line)) technician = "both";

        // Try to detect color code
        const colorMatch = line.match(/(\d+Y|T\d|both)/i);
        const colorCode = colorMatch ? colorMatch[0] : undefined;

        currentStep = {
          title: title.trim(),
          duration,
          colorCode,
          technician,
          tasks: []
        };
      } else if (currentStep && line.trim()) {
        // Add as task if it's a sub-item
        if (line.length < 200 && (line.match(/^[\s-•\*]/) || line.match(/^\d+\.\d+/))) {
          currentStep.tasks.push(line.trim());
        }
      }
    }

    if (currentStep) {
      steps.push(currentStep);
    }

    return {
      model: detectedModel || "Unknown Model",
      serviceType: detectedServiceType || "Unknown Service",
      steps
    };
  };

  const handleParsePDF = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await extractTextFromPDF(file);
      setExtractedText(text);

      const parsed = parseFlowchartData(text);
      setParsedData(parsed);

      // Update form fields
      if (!model) setModel(parsed.model);
      if (!serviceType) setServiceType(parsed.serviceType);

    } catch (err) {
      setError(`Failed to parse PDF: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!parsedData) return;

    // Convert parsed data to FlowchartData format
    const steps: FlowchartStep[] = parsedData.steps.map((step, index) => {
      // Arrange steps in a grid (3 columns)
      const x = index % 3;
      const y = Math.floor(index / 3);

      // Generate color if not provided
      const colors = ["#FF9800", "#2196F3", "#4CAF50", "#FFC107", "#9C27B0", "#FF5722", "#E91E63", "#795548"];
      const color = colors[index % colors.length];

      const durationMinutes = parseInt(step.duration.replace(/\D/g, "")) || 60;

      return {
        id: generateStepId(),
        title: step.title,
        duration: step.duration,
        durationMinutes,
        color,
        colorCode: step.colorCode || `${index + 1}Y`,
        technician: step.technician || "both",
        position: { x, y },
        tasks: step.tasks.map(taskDesc => ({
          id: generateTaskId(),
          description: taskDesc,
          completed: false
        }))
      };
    });

    const totalMinutes = steps.reduce((sum, step) => sum + step.durationMinutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    const flowchart: FlowchartData = {
      id: generateFlowchartId(model, serviceType),
      model,
      serviceType,
      optimizedSIF: "Imported",
      referenceDocument: file?.name || "Imported from PDF",
      revisionDate: new Date().toLocaleDateString(),
      technicians: 2,
      totalTime: `${totalMinutes}m`,
      totalMinutes,
      workHours: `${totalHours}:${remainingMinutes.toString().padStart(2, "0")}h`,
      duration: `${totalHours}:${remainingMinutes.toString().padStart(2, "0")}h`,
      steps,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    onImport(flowchart);
    onOpenChange(false);

    // Reset state
    setFile(null);
    setExtractedText("");
    setParsedData(null);
    setModel("");
    setServiceType("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Flowchart from PDF</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="pdf-file">PDF File</Label>
            <div className="flex gap-2">
              <Input
                id="pdf-file"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button
                onClick={handleParsePDF}
                disabled={!file || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Parse PDF
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a PDF containing flowchart data. The system will attempt to extract steps and tasks automatically.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Manual Fields */}
          {extractedText && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">Turbine Model</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g., EnVentus Mk 0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Input
                  id="serviceType"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="e.g., 1Y Service"
                />
              </div>
            </div>
          )}

          {/* Parsed Data Preview */}
          {parsedData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Parsed {parsedData.steps.length} Steps</h3>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {parsedData.steps.map((step, index) => (
                  <Card key={index}>
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{step.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {step.duration} • {step.tasks.length} tasks • {step.technician}
                          </p>
                        </div>
                        {step.colorCode && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {step.colorCode}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  Review the parsed data above. You can edit individual steps after importing.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Extracted Text Preview (collapsible) */}
          {extractedText && (
            <details className="border rounded p-3">
              <summary className="cursor-pointer text-sm font-medium">
                View Extracted Text ({extractedText.length} characters)
              </summary>
              <pre className="mt-2 text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded max-h-40 overflow-auto">
                {extractedText.substring(0, 2000)}
                {extractedText.length > 2000 && "..."}
              </pre>
            </details>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parsedData || !model || !serviceType}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Flowchart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
