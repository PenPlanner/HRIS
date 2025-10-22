import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type AggregatedTrainingNeed = {
  course_id: string;
  course_name: string;
  course_code?: string;
  technicians: {
    id: string;
    initials: string;
    name: string;
    team_name: string;
    team_color: string;
    reason: string;
    priority: boolean;
  }[];
  priority_count: number;
  total_count: number;
};

type PlannedCourseAggregated = {
  course_id: string;
  course_name: string;
  course_code?: string;
  technicians: {
    id: string;
    initials: string;
    name: string;
    team_name: string;
    team_color: string;
  }[];
  total_count: number;
};

export function exportTrainingNeedsToPDF(
  data: AggregatedTrainingNeed[],
  filters: {
    team: string;
    period: string;
    view: "needs" | "planned";
  }
) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Team Training Overview", 14, 20);

  // Subheader with filters
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${filters.period}`, 14, 28);
  doc.text(`Team: ${filters.team}`, 14, 33);
  doc.text(`View: ${filters.view === "needs" ? "Training Needs" : "Planned Courses"}`, 14, 38);
  doc.text(`Generated: ${new Date().toLocaleDateString("sv-SE")}`, 14, 43);

  let yPosition = 50;

  // Statistics
  const totalCourses = data.length;
  const totalTechnicians = data.reduce((sum, item) => sum + item.total_count, 0);
  const priorityCount = data.filter((item) => item.priority_count > 0).length;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, yPosition);
  yPosition += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total Courses: ${totalCourses}`, 14, yPosition);
  doc.text(`Total Technicians: ${totalTechnicians}`, 70, yPosition);
  if (filters.view === "needs") {
    doc.text(`Priority Courses: ${priorityCount}`, 140, yPosition);
  }
  yPosition += 10;

  // Course details
  data.forEach((need, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Course header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const courseTitle = need.course_code
      ? `${need.course_name} (${need.course_code})`
      : need.course_name;
    doc.text(courseTitle, 14, yPosition);

    // Priority indicator
    if (need.priority_count > 0 && filters.view === "needs") {
      doc.setTextColor(255, 140, 0); // Orange for priority
      doc.text("⭐ PRIORITY", 150, yPosition);
      doc.setTextColor(0, 0, 0); // Reset to black
    }

    yPosition += 5;

    // Course stats
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${need.total_count} technician${need.total_count !== 1 ? "s" : ""}`, 14, yPosition);
    if (need.priority_count > 0 && filters.view === "needs") {
      doc.text(`(${need.priority_count} priority)`, 50, yPosition);
    }
    yPosition += 5;

    // Technicians table
    const tableData = need.technicians.map((tech) => {
      const row = [
        tech.initials,
        tech.name,
        tech.team_name,
      ];
      if (filters.view === "needs") {
        row.push(tech.reason);
        row.push(tech.priority ? "Yes" : "No");
      }
      return row;
    });

    const headers = filters.view === "needs"
      ? ["Initials", "Name", "Team", "Reason", "Priority"]
      : ["Initials", "Name", "Team"];

    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246], fontStyle: "bold" },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer on each page
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Page ${doc.getCurrentPageInfo().pageNumber}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
        doc.setTextColor(0);
      },
    });

    // @ts-ignore - autoTable adds finalY to doc
    yPosition = doc.lastAutoTable.finalY + 10;
  });

  // Save the PDF
  const fileName = `training-overview-${filters.period.replace(" ", "-")}-${filters.team.replace(" ", "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

export function exportPlannedCoursesToPDF(
  data: PlannedCourseAggregated[],
  filters: {
    team: string;
    period: string;
  }
) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Planned Courses Overview", 14, 20);

  // Subheader with filters
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${filters.period}`, 14, 28);
  doc.text(`Team: ${filters.team}`, 14, 33);
  doc.text(`Generated: ${new Date().toLocaleDateString("sv-SE")}`, 14, 38);

  let yPosition = 48;

  // Statistics
  const totalCourses = data.length;
  const totalTechnicians = data.reduce((sum, item) => sum + item.total_count, 0);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, yPosition);
  yPosition += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total Courses: ${totalCourses}`, 14, yPosition);
  doc.text(`Total Technicians: ${totalTechnicians}`, 70, yPosition);
  yPosition += 10;

  // Course details
  data.forEach((course) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Course header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const courseTitle = course.course_code
      ? `${course.course_name} (${course.course_code})`
      : course.course_name;
    doc.text(courseTitle, 14, yPosition);
    yPosition += 5;

    // Course stats
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${course.total_count} technician${course.total_count !== 1 ? "s" : ""}`, 14, yPosition);
    yPosition += 5;

    // Technicians table
    const tableData = course.technicians.map((tech) => [
      tech.initials,
      tech.name,
      tech.team_name,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Initials", "Name", "Team"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246], fontStyle: "bold" },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer on each page
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Page ${doc.getCurrentPageInfo().pageNumber}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
        doc.setTextColor(0);
      },
    });

    // @ts-ignore - autoTable adds finalY to doc
    yPosition = doc.lastAutoTable.finalY + 10;
  });

  // Save the PDF
  const fileName = `planned-courses-${filters.period.replace(" ", "-")}-${filters.team.replace(" ", "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
