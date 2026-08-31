interface ChartBatchExportData {
  id: string;
  title: string;
  data: ChartData[];
  dataKeys: string[];
  elementSelector: string;
}

interface ChartData {
  name: string;
  [key: string]: unknown;
}

export const exportBatchToExcel = async (charts: ChartBatchExportData[]) => {
  const [XLSX, { saveAs }] = await Promise.all([
    import("xlsx"),
    import("file-saver"),
  ]);

  const workbook = XLSX.utils.book_new();

  charts.forEach((chart) => {
    const worksheetData = chart.data.map((item) => ({
      Name: item.name,
      ...Object.fromEntries(chart.dataKeys.map((key) => [key, item[key]])),
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, chart.title.slice(0, 31));
  });

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, "analytics-batch-export.xlsx");
};

export const exportBatchToPDF = async (charts: ChartBatchExportData[]) => {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const pdf = new jsPDF("p", "mm", "a4");
  const imgWidth = 190;
  let yOffset = 10;

  for (const chart of charts) {
    pdf.setFontSize(14);
    pdf.text(chart.title, 10, yOffset);
    yOffset += 10;

    const chartElement = document.querySelector(chart.elementSelector);
    if (chartElement) {
      const canvas = await html2canvas(chartElement as HTMLElement);
      const imgData = canvas.toDataURL("image/png");
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, yOffset, imgWidth, imgHeight);
      yOffset += imgHeight + 10;

      if (yOffset > 250) {
        pdf.addPage();
        yOffset = 10;
      }
    }
  }

  pdf.save("analytics-batch-export.pdf");
};

export const exportBatchToCSV = async (charts: ChartBatchExportData[]) => {
  const { saveAs } = await import("file-saver");

  let csvContent = "";

  charts.forEach((chart) => {
    csvContent += `${chart.title}\n`;
    const headers = ["name", ...chart.dataKeys];
    const rows = chart.data.map((item) =>
      headers.map((key) => `"${item[key] ?? ""}"`).join(","),
    );
    csvContent += [headers.join(","), ...rows].join("\n") + "\n\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, "analytics-batch-export.csv");
};

export const exportBatchToJSON = async (charts: ChartBatchExportData[]) => {
  const { saveAs } = await import("file-saver");

  const jsonData = charts.reduce(
    (acc, chart) => ({
      ...acc,
      [chart.id]: {
        title: chart.title,
        data: chart.data,
        dataKeys: chart.dataKeys,
      },
    }),
    {},
  );
  const jsonContent = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonContent], {
    type: "application/json;charset=utf-8;",
  });
  saveAs(blob, "analytics-batch-export.json");
};
