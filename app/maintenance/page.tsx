"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, Wrench, Sparkles, Settings } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="text-center space-y-6 pb-4">
          <div className="flex justify-center">
            <div className="relative">
              <Construction className="h-24 w-24 text-blue-600 animate-pulse" />
              <Sparkles className="h-8 w-8 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
              <Settings className="h-6 w-6 text-purple-500 absolute -bottom-1 -left-1 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            System Under Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-8">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Wrench className="h-6 w-6" />
            <p className="text-xl">
              We're currently performing scheduled maintenance and improvements.
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-3">
              What we're working on:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 text-left list-none">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Enhanced touch controls for iPad and tablets</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Pinch-to-zoom and smooth gesture support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Improved performance and responsiveness</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Better mobile and touch device experience</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-base text-muted-foreground font-medium">
              The system will be back online soon.
            </p>
            <p className="text-sm text-muted-foreground">
              Thank you for your patience while we make HRIS even better!
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              For urgent matters, please contact your system administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
