import { jsPDF } from "jspdf";

/* Genera el PDF del acta oficial en el frontend. Sin backend. */

const PAGE_W = 210;
const MARGIN = 12;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = 282;

function ensureSpace(doc, y, needed) {
  if (y + needed > BOTTOM) {
    doc.addPage();
    return 20;
  }
  return y;
}

function header(doc) {
  let y = 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("UNIVERSIDAD TECNOLOGICA DEL CHOCO", PAGE_W / 2, y, {
    align: "center",
  });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Diego Luis Cordoba", PAGE_W / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PROCESO GESTION CURRICULAR Y ACADEMICA", PAGE_W / 2, y, {
    align: "center",
  });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Codigo: F-GCA-24 · Version: 1 · Fecha: 14-01-2023", PAGE_W / 2, y, {
    align: "center",
  });
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("FORMATO DE REGISTRO DE ASISTENCIA A CLASES", PAGE_W / 2, y, {
    align: "center",
  });
  y += 4;
  doc.setDrawColor(0);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  return y + 7;
}

function fields(doc, record, y) {
  const pairs = [
    ["FACULTAD", record.faculty],
    ["PROGRAMA", record.program],
    ["NIVEL", record.level],
    ["ASIGNATURA", record.subject],
    ["CODIGO DE ASIGNATURA", record.subjectCode],
    ["PERIODO ACADEMICO", record.period],
    ["CDS", record.cds],
    ["FECHA", record.date],
    ["NOMBRE Y APELLIDOS DEL DOCENTE", record.teacher],
    ["TEMAS TRATADOS", record.topic],
  ];
  const colW = CONTENT_W / 2;
  let cursor = y;
  const rowH = 13;
  for (let i = 0; i < pairs.length; i += 2) {
    cursor = ensureSpace(doc, cursor, rowH);
    for (let col = 0; col < 2; col += 1) {
      const pair = pairs[i + col];
      if (!pair) continue;
      const x = MARGIN + col * colW;
      doc.setDrawColor(80);
      doc.setLineWidth(0.3);
      doc.rect(x, cursor, colW, rowH);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(pair[0], x + 3, cursor + 4.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const lines = doc.splitTextToSize(String(pair[1] ?? ""), colW - 6);
      doc.text(lines.slice(0, 2), x + 3, cursor + 9);
    }
    cursor += rowH;
  }
  return cursor + 6;
}

function firmaText(student) {
  if (student.status === "Presente") {
    return student.manual ? `${student.name} (M)` : student.name;
  }
  return student.status === "Ausente" ? "Ausente" : "—";
}

function studentsTable(doc, record, y) {
  const cols = [
    { w: 12, label: "No." },
    { w: 86, label: "NOMBRES Y APELLIDOS DEL ESTUDIANTE" },
    { w: 44, label: "NUMERO DE IDENTIFICACION" },
    { w: CONTENT_W - 12 - 86 - 44, label: "FIRMA" },
  ];
  const rowH = 7;
  const drawHead = (yy) => {
    let x = MARGIN;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setFillColor(240, 240, 240);
    cols.forEach((col) => {
      doc.rect(x, yy, col.w, rowH, "FD");
      doc.text(col.label, x + 2, yy + 4.7, { maxWidth: col.w - 4 });
      x += col.w;
    });
  };
  y = ensureSpace(doc, y, rowH + 4);
  drawHead(y);
  y += rowH;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  record.students.forEach((student, index) => {
    y = ensureSpace(doc, y, rowH);
    const cells = [
      String(index + 1),
      student.name,
      student.idNumber,
      firmaText(student),
    ];
    let x = MARGIN;
    cells.forEach((cell, ci) => {
      doc.rect(x, y, cols[ci].w, rowH);
      doc.text(String(cell), x + 2, y + 4.7, { maxWidth: cols[ci].w - 4 });
      x += cols[ci].w;
    });
    y += rowH;
  });
  if (record.students.some((s) => s.manual)) {
    y = ensureSpace(doc, y, 6);
    doc.setFontSize(8);
    doc.text("1 Registro manual con justificacion autorizada.", MARGIN, y + 4);
    y += 6;
  }
  return y + 4;
}

function signatureBlock(doc, x, y, w, label, name, signature) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  if (
    signature?.kind === "upload" &&
    typeof signature.data === "string" &&
    signature.data.startsWith("data:image/png")
  ) {
    try {
      doc.addImage(signature.data, "PNG", x + w / 2 - 25, y - 28, 50, 22);
    } catch {
      /* Imagen no válida: se muestra el estado pendiente. */
    }
  } else if (signature?.kind === "typed") {
    doc.setFont("times", "italic");
    doc.setFontSize(14);
    doc.text(String(signature.data), x + w / 2, y - 12, {
      align: "center",
      maxWidth: w - 10,
    });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
  } else {
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text("PENDIENTE DE FIRMA", x + w / 2, y - 12, { align: "center" });
    doc.setTextColor(0);
  }
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.line(x, y, x + w, y);
  doc.text(label, x + w / 2, y + 5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(String(name), x + w / 2, y + 10, {
    align: "center",
    maxWidth: w - 6,
  });
}

export function buildActaPdf(record) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc);
  y = fields(doc, record, y);
  y = studentsTable(doc, record, y);
  y = ensureSpace(doc, y + 26, 30);
  y += 26;
  const colW = (CONTENT_W - 20) / 2;
  signatureBlock(
    doc,
    MARGIN,
    y,
    colW,
    "FIRMA DEL DOCENTE",
    record.teacher,
    record.teacherSignature,
  );
  signatureBlock(
    doc,
    MARGIN + colW + 20,
    y,
    colW,
    "FIRMA DEL REPRESENTANTE",
    "Jeanpier Polanco",
    record.repSignature,
  );
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Pagina ${i} de ${pages}`, PAGE_W - MARGIN, 292, {
      align: "right",
    });
    doc.setTextColor(0);
  }
  return doc;
}

export function downloadActaPdf(record) {
  const doc = buildActaPdf(record);
  const safe = String(record.subject || "acta")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  doc.save(`acta-${safe || "asistencia"}.pdf`);
}
