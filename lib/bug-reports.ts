export interface BugReportComment {
  id: string;
  timestamp: string;
  author: string; // "admin" or user name
  comment: string;
  isAdmin: boolean;
}

export interface BugReport {
  id: string;
  timestamp: string;
  flowchartId: string;
  flowchartName: string;
  stepId: string;
  stepTitle: string;
  taskId: string;
  taskDescription: string;
  reportType: "wrong_step" | "missing_reference" | "incorrect_info" | "other";
  description: string;
  status: "open" | "in_progress" | "resolved" | "wont_fix";
  comments: BugReportComment[];
  resolvedAt?: string;
}

const STORAGE_KEY = "bug_reports";

/**
 * Load all bug reports from localStorage
 */
export function loadBugReports(): BugReport[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const data = JSON.parse(stored);
    return Object.values(data) as BugReport[];
  } catch (error) {
    console.error("Failed to load bug reports:", error);
    return [];
  }
}

/**
 * Save a bug report
 */
export function saveBugReport(report: BugReport): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};

    data[report.id] = report;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save bug report:", error);
    throw error;
  }
}

/**
 * Update bug report status
 */
export function updateBugReportStatus(
  reportId: string,
  status: BugReport["status"]
): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const data = JSON.parse(stored);
    if (data[reportId]) {
      data[reportId].status = status;
      if (status === "resolved") {
        data[reportId].resolvedAt = new Date().toISOString();
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error("Failed to update bug report status:", error);
    throw error;
  }
}

/**
 * Add comment to bug report
 */
export function addBugReportComment(
  reportId: string,
  comment: string,
  isAdmin: boolean = false
): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const data = JSON.parse(stored);
    if (data[reportId]) {
      const newComment: BugReportComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        author: isAdmin ? "Admin" : "User",
        comment,
        isAdmin,
      };

      if (!data[reportId].comments) {
        data[reportId].comments = [];
      }

      data[reportId].comments.push(newComment);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error("Failed to add comment:", error);
    throw error;
  }
}

/**
 * Delete a bug report
 */
export function deleteBugReport(reportId: string): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const data = JSON.parse(stored);
    delete data[reportId];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to delete bug report:", error);
    throw error;
  }
}

/**
 * Generate a unique ID for a bug report
 */
export function generateBugReportId(): string {
  return `bug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get bug report type label
 */
export function getBugReportTypeLabel(type: BugReport["reportType"]): string {
  switch (type) {
    case "wrong_step":
      return "Wrong Step";
    case "missing_reference":
      return "Missing Reference";
    case "incorrect_info":
      return "Incorrect Information";
    case "other":
      return "Other";
    default:
      return type;
  }
}

/**
 * Get bug report status color
 */
export function getBugReportStatusColor(status: BugReport["status"]): string {
  switch (status) {
    case "open":
      return "bg-red-100 text-red-800 border-red-300";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "resolved":
      return "bg-green-100 text-green-800 border-green-300";
    case "wont_fix":
      return "bg-gray-100 text-gray-800 border-gray-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}
