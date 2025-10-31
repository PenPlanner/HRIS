"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, Wrench, Sparkles } from "lucide-react";

export default function FlowchartsPage() {
  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center space-y-4 pb-4">
            <div className="flex justify-center">
              <div className="relative">
                <Construction className="h-20 w-20 text-blue-600 animate-pulse" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Flowcharts Under Development
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Wrench className="h-5 w-5" />
              <p className="text-lg">
                We're currently optimizing the flowchart experience for iPad and touch devices.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>What's coming:</strong>
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 text-left list-disc list-inside">
                <li>Enhanced touch controls for iPad</li>
                <li>Pinch-to-zoom and smooth gestures</li>
                <li>Larger touch targets for better usability</li>
                <li>Improved performance and responsiveness</li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              This page will be back online soon. Thank you for your patience!
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
