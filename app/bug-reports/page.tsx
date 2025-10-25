"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bug, ExternalLink, MessageSquare, Trash2, Filter } from "lucide-react";
import {
  BugReport,
  loadBugReports,
  updateBugReportStatus,
  addBugReportComment,
  deleteBugReport,
  getBugReportTypeLabel,
  getBugReportStatusColor,
} from "@/lib/bug-reports";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function BugReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<BugReport[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isAdmin, setIsAdmin] = useState(false); // TODO: Replace with actual auth

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const allReports = loadBugReports();
    setReports(allReports);
  };

  const filteredReports = reports.filter((report) => {
    if (filterStatus !== "all" && report.status !== filterStatus) return false;
    if (filterType !== "all" && report.reportType !== filterType) return false;
    return true;
  });

  const handleStatusChange = (reportId: string, newStatus: BugReport["status"]) => {
    updateBugReportStatus(reportId, newStatus);
    toast.success("Status updated");
    loadReports();
  };

  const handleAddComment = (reportId: string) => {
    if (!commentText.trim()) return;

    addBugReportComment(reportId, commentText.trim(), isAdmin);
    toast.success("Comment added");
    setCommentText("");
    loadReports();
  };

  const handleDelete = (reportId: string) => {
    if (confirm("Are you sure you want to delete this bug report?")) {
      deleteBugReport(reportId);
      toast.success("Bug report deleted");
      loadReports();
    }
  };

  const handleViewInContext = (report: BugReport) => {
    // Navigate to the flowchart and open the step drawer
    router.push(`/flowcharts/${report.flowchartId.split('-')[0]}/${report.flowchartId}?task=${report.taskId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Bug className="h-6 w-6 text-red-600" />
                <h1 className="text-2xl font-bold">Bug Reports</h1>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto px-6 py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-500" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="wont_fix">Won&apos;t Fix</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="wrong_step">Wrong Step</SelectItem>
                  <SelectItem value="missing_reference">Missing Reference</SelectItem>
                  <SelectItem value="incorrect_info">Incorrect Information</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex-1" />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Admin Mode</span>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bug Reports List */}
      <div className="container mx-auto px-6 pb-12">
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bug className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No bug reports found</p>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn("text-xs border", getBugReportStatusColor(report.status))}>
                          {report.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getBugReportTypeLabel(report.reportType)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(report.timestamp).toLocaleString('sv-SE')}
                        </span>
                      </div>
                      <CardTitle className="text-base font-semibold">
                        {report.taskDescription}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {report.flowchartName} • {report.stepTitle.split('\n')[0]}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInContext(report)}
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View in Context
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(report.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Description */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <p className="text-sm whitespace-pre-wrap">{report.description}</p>
                  </div>

                  {/* Status Change */}
                  {isAdmin && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm font-medium">Change Status:</span>
                      <Select
                        value={report.status}
                        onValueChange={(value) => handleStatusChange(report.id, value as BugReport["status"])}
                      >
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="wont_fix">Won&apos;t Fix</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Comments */}
                  {report.comments && report.comments.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <MessageSquare className="h-4 w-4" />
                        Comments ({report.comments.length})
                      </div>
                      {report.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={cn(
                            "p-3 rounded-lg text-sm",
                            comment.isAdmin
                              ? "bg-blue-50 border border-blue-200"
                              : "bg-gray-50 border border-gray-200"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "text-xs font-semibold",
                              comment.isAdmin ? "text-blue-700" : "text-gray-700"
                            )}>
                              {comment.author}
                              {comment.isAdmin && " (Admin)"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.timestamp).toLocaleString('sv-SE')}
                            </span>
                          </div>
                          <p className="text-sm">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 min-h-[60px] text-sm"
                    />
                    <Button
                      onClick={() => handleAddComment(report.id)}
                      disabled={!commentText.trim()}
                      className="self-end"
                      size="sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
