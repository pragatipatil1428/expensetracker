import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (cell: string | number) => `"${String(cell).replaceAll('"', '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export interface PdfTable {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export function downloadPdf(opts: {
  filename: string;
  title: string;
  subtitle: string;
  summary: { label: string; value: string }[];
  tables: PdfTable[];
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setTextColor(40, 40, 60);
  doc.text(opts.title, 14, 18);

  doc.setFontSize(11);
  doc.setTextColor(110, 110, 130);
  doc.text(opts.subtitle, 14, 26);

  // Summary boxes
  let x = 14;
  const boxWidth = (pageWidth - 28 - 8 * (opts.summary.length - 1)) / opts.summary.length;
  doc.setFillColor(245, 245, 250);
  opts.summary.forEach((item) => {
    doc.roundedRect(x, 32, boxWidth, 18, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 140);
    doc.text(item.label.toUpperCase(), x + 3, 38);
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 60);
    doc.text(item.value, x + 3, 46);
    x += boxWidth + 8;
  });

  let startY = 58;
  opts.tables.forEach((table, index) => {
    if (index > 0) {
      startY += 8;
    }
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 60);
    doc.text(table.title, 14, startY);
    autoTable(doc, {
      head: [table.headers],
      body: table.rows.map((row) => row.map(String)),
      startY: startY + 3,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [247, 247, 252] },
      margin: { left: 14, right: 14 },
    });
    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY;
    if (finalY) startY = finalY;
  });

  doc.save(opts.filename);
}
