interface ExportToExcelProps {
  title: string;
  data: string[][] | [];
  headers: string[];
}

export const exportToExcel = async ({
  title,
  data,
  headers,
}: ExportToExcelProps) => {
  if (!title) throw new Error("Title is required");
  if (!headers || headers.length === 0) throw new Error("Headers are required");
  if (!data || !Array.isArray(data))
    throw new Error("Data must be an array of arrays");

  const [XLSX, { saveAs }] = await Promise.all([
    import("xlsx"),
    import("file-saver"),
  ]);

  const worksheetData = [headers, ...data];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title.slice(0, 31));

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `${title.replace(/\s+/g, "-")}.xlsx`);
};

interface ExportToPdfProps {
  title: string;
  data: string[][];
  headers: string[];
  summaryLines?: string[];
}

export const exportToPdf = async ({
  title,
  data,
  headers,
  summaryLines = [],
}: ExportToPdfProps) => {
  const { default: jsPDF } = await import("jspdf");

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 10;
  const usableWidth = pageWidth - marginX * 2;
  const colCount = Math.max(headers.length, 1);
  const colWidth = usableWidth / colCount;
  let y = 12;

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text(title, marginX, y);
  y += 7;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  for (const line of summaryLines) {
    pdf.text(line, marginX, y);
    y += 5;
  }
  if (summaryLines.length) y += 2;

  const drawHeader = () => {
    pdf.setFillColor(241, 245, 249);
    pdf.rect(marginX, y - 4, usableWidth, 7, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    headers.forEach((header, i) => {
      pdf.text(String(header), marginX + i * colWidth + 1, y, {
        maxWidth: colWidth - 2,
      });
    });
    y += 6;
    pdf.setFont("helvetica", "normal");
  };

  drawHeader();

  for (const row of data) {
    if (y > pageHeight - 12) {
      pdf.addPage();
      y = 12;
      drawHeader();
    }

    let rowHeight = 5;
    row.forEach((cell) => {
      const lines = pdf.splitTextToSize(String(cell ?? "-"), colWidth - 2);
      rowHeight = Math.max(rowHeight, lines.length * 4);
    });

    row.forEach((cell, i) => {
      const lines = pdf.splitTextToSize(String(cell ?? "-"), colWidth - 2);
      pdf.text(lines, marginX + i * colWidth + 1, y);
    });
    y += rowHeight + 1;
  }

  pdf.save(`${title.replace(/\s+/g, "-")}.pdf`);
};
