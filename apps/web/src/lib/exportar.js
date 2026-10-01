/* Utilidades de exportación en el frontend. CSV para datos tabulares y
   PDF para informes formales. Sin backend: el archivo se genera en el
   navegador y se descarga directamente. */

import { jsPDF } from "jspdf";

/* Descarga un CSV a partir de columnas y filas. */
export function descargarCsv({ nombre, columnas, filas }) {
  const escape = (valor) => {
    const texto = String(valor ?? "");
    return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  const lineas = [
    columnas.map((c) => escape(c.header)).join(","),
    ...filas.map((fila) => columnas.map((c) => escape(fila[c.key])).join(",")),
  ];
  const blob = new Blob(["\uFEFF" + lineas.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombre}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* Descarga un PDF con título, subtítulo y una tabla paginada. */
export function descargarInformePdf({ titulo, sub, columnas, filas }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PAGE_W = 210;
  const MARGIN = 14;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const BOTTOM = 282;

  const cabecera = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("UNIVERSIDAD TECNOLOGICA DEL CHOCO", PAGE_W / 2, 16, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Plataforma de asistencia académica", PAGE_W / 2, 21, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(titulo, PAGE_W / 2, 30, { align: "center" });
    if (sub) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(sub, PAGE_W / 2, 35, { align: "center" });
    }
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, 38, PAGE_W - MARGIN, 38);
  };

  const pie = () => {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i += 1) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Página ${i} de ${total}`, PAGE_W / 2, 292, { align: "center" });
    }
  };

  cabecera();
  let y = 44;

  const colW = CONTENT_W / columnas.length;
  const dibujarFila = (valores, bold) => {
    if (y + 8 > BOTTOM) {
      doc.addPage();
      cabecera();
      y = 44;
    }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(8.5);
    valores.forEach((valor, i) => {
      const x = MARGIN + i * colW;
      doc.rect(x, y - 4, colW, 8);
      doc.text(String(valor ?? ""), x + 1.5, y, { maxWidth: colW - 3 });
    });
    y += 8;
  };

  dibujarFila(columnas.map((c) => c.header), true);
  filas.forEach((fila) => dibujarFila(columnas.map((c) => fila[c.key]), false));

  pie();
  doc.save(`${titulo.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}
