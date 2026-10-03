import { jsPDF } from "jspdf";

/* Acta oficial F-GCA-24 — REGISTRO DE ASISTENCIA A CLASES QUE LLEVA EL DOCENTE.
   Plantilla de referencia: "REGISTRO DE ASISTENCIA A CLASES QUE LLEVA EL DOCENTE (1).docx"
   Estructura analizada directamente del .docx (word/document.xml + word/header1.xml):
   - Página Legal (8.5 x 14", w:12240 x h:20160 twips, code 5), márgenes aprox. 25/30/35 mm.
   - Encabezado en tabla de 3 columnas: logo | UNIVERSIDAD TECNOLOGICA DEL CHOCÓ /
     Diego Luis Córdoba / PROCESO GESTIÓN CURRICULAR Y ACADÉMICA | Código F-GCA-24 /
     Versión 1 / Fecha 14-01-2023; fila de título FORMATO DE REGISTRO DE ASISTENCIA A CLASES.
   - Tabla principal (43 filas): filas 0-5 campos (FACULTAD/PROGRAMA, NIVEL/ASIGNATURA/
     CÓDIGO, PERIODO/CDS/FECHA, DOCENTE, TEMAS etiqueta + valor alto 775 twips);
     fila 6 cabecera No./NOMBRES/NUMERO/FIRMA con anchos 462/5044/2758/2133 dxa
     (4.4% / 48.5% / 26.5% / 20.5%); filas 7-42 = 36 posiciones de estudiantes.
   - Firmas: líneas FIRMA DEL DOCENTE / FIRMA DEL REPRESENTANTE.
   - CONTROL DE CAMBIOS (FECHA/CAMBIO/VERSIÓN = 14-01-2023/Lanzamiento del formato/01).
   - Bloque Elaboró/Revisó/Aprobó con los textos institucionales del documento.
   El PDF tiene SIEMPRE 2 páginas fijas (1–24 y 25–36, con filas vacías si faltan
   registros). Solo datos reales: sin mock, sin firmas inventadas; lo no expuesto
   por el backend queda vacío. */

const PAGE_W = 215.9;
const PAGE_H = 355.6;
const MX = 14;
const TOP = 10;
const BOTTOM = PAGE_H - 12;
const CONTENT_W = PAGE_W - MX * 2;

const INSTITUCIONAL = {
  codigo: "F-GCA-24",
  version: "1",
  fechaFormato: "14-01-2023",
};

function texto(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function split(doc, text, maxWidth, maxLines = 3) {
  const lines = doc.splitTextToSize(texto(text) || "", Math.max(maxWidth, 10));
  return lines.slice(0, maxLines);
}

/* Logo institucional real (apps/web/public/image.png, servido como
   /image.png). Se carga una vez y se reutiliza; sin red, celda vacía. */
let logoCache = null;

async function blobADatos(blob) {
  if (typeof FileReader !== "undefined") {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(String(lector.result));
      lector.onerror = () => reject(lector.error);
      lector.readAsDataURL(blob);
    });
  }
  if (typeof Buffer !== "undefined") {
    const buf = Buffer.from(await blob.arrayBuffer());
    return `data:${blob.type || "image/png"};base64,${buf.toString("base64")}`;
  }
  return null;
}

export async function cargarLogo() {
  if (logoCache) return logoCache;
  try {
    const res = await fetch("/image.png", { cache: "force-cache" });
    if (!res.ok) {
      logoCache = { missing: true };
      return logoCache;
    }
    const datos = await blobADatos(await res.blob());
    logoCache = datos ? { datos } : { missing: true };
  } catch {
    logoCache = { missing: true };
  }
  return logoCache;
}

function dibujarLogo(doc, x, y, w, h, logo) {
  const datos = logo && !logo.missing ? logo.datos : null;
  if (!datos) return;
  try {
    const props = doc.getImageProperties(datos);
    if (!props || !props.width || !props.height) return;
    const maxW = w - 4;
    const maxH = h - 2;
    const escala = Math.min(maxW / props.width, maxH / props.height);
    const iw = props.width * escala;
    const ih = props.height * escala;
    doc.addImage(datos, "PNG", x + (w - iw) / 2, y + (h - ih) / 2, iw, ih, undefined, "FAST");
  } catch {
    /* Logo no utilizable: celda vacía, sin texto sustituto. */
  }
}

/* Encabezado institucional: reproduce la tabla del header1.xml. Devuelve y final. */
function dibujarEncabezado(doc, y, logo) {
  const x = MX;
  const w = CONTENT_W;
  const logoW = 30;
  const metaW = 46;
  const centroW = w - logoW - metaW;
  const rowH = 6;
  const headH = rowH * 3;

  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.rect(x, y, w, headH);

  doc.line(x + logoW, y, x + logoW, y + headH);
  doc.line(x + logoW + centroW, y, x + logoW + centroW, y + headH);
  for (let i = 1; i < 3; i += 1) {
    doc.line(x + logoW + centroW, y + rowH * i, x + w, y + rowH * i);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(0);
  dibujarLogo(doc, x, y, logoW, headH, logo);

  const cx = x + logoW + centroW / 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("UNIVERSIDAD TECNOLOGICA DEL CHOCÓ", cx, y + 5.2, {
    align: "center",
    maxWidth: centroW - 4,
  });
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(9);
  doc.text("Diego Luis Córdoba", cx, y + 10, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("PROCESO GESTIÓN CURRICULAR Y ACADÉMICA", cx, y + 15, {
    align: "center",
    maxWidth: centroW - 4,
  });

  const metaX = x + logoW + centroW + 2.5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Código:", metaX, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(INSTITUCIONAL.codigo, metaX + 13, y + 5);
  doc.setFont("helvetica", "bold");
  doc.text("Versión:", metaX, y + 11);
  doc.setFont("helvetica", "normal");
  doc.text(INSTITUCIONAL.version, metaX + 13, y + 11);
  doc.setFont("helvetica", "bold");
  doc.text("Fecha:", metaX, y + 16.5);
  doc.setFont("helvetica", "normal");
  doc.text(INSTITUCIONAL.fechaFormato, metaX + 11, y + 16.5);

  const ty = y + headH;
  const titleH = 8.5;
  doc.rect(x, ty, w, titleH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text("FORMATO DE REGISTRO DE ASISTENCIA A CLASES", x + w / 2, ty + 5.8, {
    align: "center",
    maxWidth: w - 6,
  });
  return ty + titleH;
}

/* Encabezado oficial reutilizable: tabla institucional + datos de la
   asistencia. Se usa en la página 1 y en la página 2. */
function drawAttendanceHeader(doc, y, datos, logo) {
  y = dibujarEncabezado(doc, y, logo);
  y = dibujarCampos(doc, y, datos);
  return y + 3;
}

/* Filas de estudiantes con numeración global continua (inicio..fin). */
function drawStudentRows(doc, y, filas, inicio, fin, rowH) {
  for (let n = inicio; n <= fin; n += 1) {
    const f = filas[n - 1] || { nombre: "", identificacion: "", firma: null, tipoFirma: null };
    y = dibujarFilaEstudiante(doc, y, n, f.nombre, f.identificacion, f.firma, f.tipoFirma, rowH);
  }
  return y;
}

function campo(doc, x, y, w, h, etiqueta, valor) {
  doc.setDrawColor(0);
  doc.setLineWidth(0.35);
  doc.rect(x, y, w, h);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(etiqueta, x + 2, y + 3.8, { maxWidth: w - 4 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const lineas = split(doc, valor, w - 4, 2);
  doc.text(lineas.length ? lineas : [""], x + 2, y + 7.6);
}

/* Filas de campos según el orden del Word: facultad/programa, nivel/asignatura/
   código, periodo/cds/fecha, docente, temas. */
function dibujarCampos(doc, y, datos) {
  const x = MX;
  const w = CONTENT_W;
  const h = 10;
  let cy = y + 3;

  const mitad = w / 2;
  campo(doc, x, cy, mitad, h, "FACULTAD", datos.facultad);
  campo(doc, x + mitad, cy, w - mitad, h, "PROGRAMA", datos.programa);
  cy += h;

  const wNivel = w * 0.22;
  const wCodigo = w * 0.3;
  const wAsig = w - wNivel - wCodigo;
  campo(doc, x, cy, wNivel, h, "NIVEL", datos.nivel);
  campo(doc, x + wNivel, cy, wAsig, h, "ASIGNATURA", datos.asignatura);
  campo(doc, x + wNivel + wAsig, cy, wCodigo, h, "CÓDIGO DE ASIGNATURA", datos.codigoAsignatura);
  cy += h;

  const wPeriodo = w * 0.42;
  const wFecha = w * 0.26;
  const wCds = w - wPeriodo - wFecha;
  campo(doc, x, cy, wPeriodo, h, "PERIODO ACADÉMICO", datos.periodo);
  campo(doc, x + wPeriodo, cy, wCds, h, "CDS", datos.cds);
  campo(doc, x + wPeriodo + wCds, cy, wFecha, h, "FECHA", datos.fecha);
  cy += h;

  campo(doc, x, cy, w, h, "NOMBRE Y APELLIDOS DEL DOCENTE", datos.docente);
  cy += h;

  const labelH = 6;
  const valorH = 14;
  doc.setDrawColor(0);
  doc.setLineWidth(0.35);
  doc.rect(x, cy, w, labelH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("TEMAS TRATADOS", x + 2, cy + 4);
  cy += labelH;
  doc.rect(x, cy, w, valorH);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(split(doc, datos.temas, w - 4, 3), x + 2, cy + 5);
  cy += valorH;
  return cy;
}

const COLS_PORC = [0.044, 0.485, 0.265, 0.206];
const COL_TITULOS = [
  "No.",
  "NOMBRE DEL ESTUDIANTE",
  "CÉDULA",
  "FIRMA",
];

function anchosTabla() {
  return COLS_PORC.map((p) => CONTENT_W * p);
}

function dibujarCabeceraTabla(doc, y) {
  const ws = anchosTabla();
  const h = 8;
  let x = MX;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setDrawColor(0);
  doc.setLineWidth(0.35);
  doc.setFillColor(0, 0, 0);
  doc.setTextColor(255, 255, 255);
  ws.forEach((cw, i) => {
    // El color de relleno se fija en cada celda: el operador de texto
    // cambia el fill state del PDF y sin esto solo la primera celda
    // conservaría el fondo negro.
    doc.setFillColor(0, 0, 0);
    doc.rect(x, y, cw, h, "FD");
    const lineas = split(doc, COL_TITULOS[i], cw - 4, 2);
    const altoLinea = 3.4;
    const y0 = y + (h - altoLinea * lineas.length) / 2 + 2.8;
    lineas.forEach((linea, li) => {
      doc.text(linea, x + cw / 2, y0 + li * altoLinea, { align: "center", maxWidth: cw - 4 });
    });
    x += cw;
  });
  doc.setTextColor(0);
  return y + h;
}

function dibujarFilaEstudiante(doc, y, numero, nombre, identificacion, firma, tipoFirma, rowH) {
  const ws = anchosTabla();
  let x = MX;
  const celdas = [String(numero), texto(nombre), texto(identificacion), ""];
  doc.setFont("helvetica", "normal");
  celdas.forEach((valor, i) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.35);
    doc.rect(x, y, ws[i], rowH);
    if (i === 3) {
      // Columna FIRMA: imagen real del snapshot (DRAWN/UPLOAD) o texto
      // en cursiva (TYPED). Sin firma: celda vacía, sin contenido inventado.
      dibujarFirmaCelda(doc, x, y, ws[i], rowH, firma, tipoFirma);
    } else if (i === 0) {
      doc.setFontSize(8.5);
      doc.text(valor, x + ws[i] / 2, y + rowH / 2 + 1.4, { align: "center" });
    } else {
      doc.setFontSize(8.5);
      doc.text(split(doc, valor, ws[i] - 3, 2), x + 2, y + rowH / 2 + 1.2);
    }
    x += ws[i];
  });
  return y + rowH;
}

/* Firma dentro de la celda (x, y, w, h): imagen ajustada con proporción o
   texto en cursiva para TYPED. Nunca se sale de la celda ni tapa bordes. */
function dibujarFirmaCelda(doc, x, y, w, h, firma, tipoFirma) {
  if (!firma || typeof firma !== "string" || !firma.trim()) return;
  const valor = firma.trim();
  const img = formatoFirma(valor);
  if (img) {
    try {
      const props = doc.getImageProperties(img.data);
      if (!props || !props.width || !props.height) return;
      const maxW = w - 4;
      const maxH = h - 1.6;
      if (maxW <= 0 || maxH <= 0) return;
      const escala = Math.min(maxW / props.width, maxH / props.height);
      const iw = props.width * escala;
      const ih = props.height * escala;
      doc.addImage(img.data, img.format, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih, undefined, "FAST");
      return;
    } catch {
      return;
    }
  }
  // TYPED u otro texto almacenado: se respeta tal cual, en cursiva.
  try {
    doc.setFont("times", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(0);
    const lineas = split(doc, valor, w - 3, 2);
    const altoLinea = 3.4;
    const y0 = y + (h - altoLinea * lineas.length) / 2 + 2.6;
    lineas.forEach((linea, i) => {
      doc.text(linea, x + w / 2, y0 + i * altoLinea, { align: "center", maxWidth: w - 3 });
    });
  } catch {
    /* Texto no representable: celda vacía. */
  } finally {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
  }
}

function formatoFirma(firma) {
  if (!firma || typeof firma !== "string" || !firma.startsWith("data:image/")) return null;
  const coma = firma.indexOf(",");
  if (coma < 0) return null;
  const cabecera = firma.slice(5, coma);
  const tipo = cabecera.split(";")[0].toLowerCase();
  if (tipo === "image/png") return { data: firma, format: "PNG" };
  if (tipo === "image/jpeg" || tipo === "image/jpg") return { data: firma, format: "JPEG" };
  return null;
}

function dibujarFirma(doc, x, y, w, etiqueta, nombre, firmaDataUrl) {
  const lineaY = y + 26;
  const img = formatoFirma(firmaDataUrl);
  if (img) {
    try {
      const props = doc.getImageProperties(img.data);
      const maxW = w - 16;
      const maxH = 20;
      const escala = Math.min(maxW / props.width, maxH / props.height);
      const iw = props.width * escala;
      const ih = props.height * escala;
      doc.addImage(img.data, img.format, x + w / 2 - iw / 2, lineaY - ih - 3, iw, ih, undefined, "FAST");
    } catch {
      /* Firma no válida: se deja el espacio vacío según la fase. */
    }
  }
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.line(x + 4, lineaY, x + w - 4, lineaY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(etiqueta, x + w / 2, lineaY + 5.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (texto(nombre)) {
    doc.text(split(doc, nombre, w - 8, 2), x + w / 2, lineaY + 10, { align: "center" });
  }
  return lineaY + 15;
}

function dibujarControlCambios(doc, y) {
  const x = MX;
  const w = CONTENT_W;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CONTROL DE CAMBIOS", x + w / 2, y + 5, { align: "center" });
  const ty = y + 8;
  const cw = w / 3;
  const hh = 7;
  const rh = 7;
  let cx = x;
  ["FECHA", "CAMBIO", "VERSIÓN"].forEach((t) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.35);
    doc.rect(cx, ty, cw, hh);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(t, cx + cw / 2, ty + 4.8, { align: "center" });
    cx += cw;
  });
  cx = x;
  ["14-01-2023", "Lanzamiento del formato", "01"].forEach((t) => {
    doc.rect(cx, ty + hh, cw, rh);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(t, cx + cw / 2, ty + hh + 4.8, { align: "center", maxWidth: cw - 4 });
    cx += cw;
  });
  return ty + hh + rh;
}

function dibujarElaboro(doc, y) {
  const x = MX;
  const w = CONTENT_W;
  const cw = w / 3;
  const h = 26;
  const bloques = [
    ["Elaboró: Leidy Lorena Cuesta Mena", "Cargo: Profesional Universitario", "Fecha: 14-01-2023"],
    ["Revisó: Ana Silvia Rentería", "Cargo: Vicerrectora de Docencia", "Fecha: 14-01-2023"],
    ["Aprobó: Tamara Mery Ketty", "Cargo: Coordinadora de Calidad", "Fecha: 14-01-2023"],
  ];
  doc.setFontSize(7.5);
  bloques.forEach((lineas, i) => {
    const bx = x + cw * i;
    doc.setDrawColor(0);
    doc.setLineWidth(0.35);
    doc.rect(bx, y, cw, h);
    doc.setFont("helvetica", "normal");
    lineas.forEach((linea, li) => {
      doc.text(split(doc, linea, cw - 5, 2), bx + 2.5, y + 6 + li * 6);
    });
  });
  return y + h;
}

function piePagina(doc, actual, total) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Página ${actual} de ${total}`, PAGE_W - MX, PAGE_H - 8, { align: "right" });
  doc.setTextColor(0);
}

/* Normaliza registros reales {nombre, identificacion, firma, tipoFirma} a
   36 filas (vacías si faltan). Si hay más de 36 no se elimina ninguno: se
   documenta y se continúa en páginas adicionales con el mismo formato. */
export function normalizarFilasEstudiantes(registros) {
  const lista = Array.isArray(registros) ? registros : [];
  return lista.map((r) => ({
    nombre: texto(r?.nombre ?? r?.name ?? ""),
    identificacion: texto(r?.identificacion ?? r?.idNumber ?? ""),
    firma: typeof r?.firma === "string" && r.firma.trim() ? r.firma.trim() : null,
    tipoFirma: typeof r?.tipoFirma === "string" ? r.tipoFirma.trim().toUpperCase() : null,
  }));
}

export function resolverProgramaNivel(sesion, ofertas) {
  const lista = Array.isArray(ofertas) ? ofertas : [];
  if (sesion?.courseOfferingId) {
    const exacta = lista.find((o) => String(o.courseOfferingId) === String(sesion.courseOfferingId));
    if (exacta) return { programa: texto(exacta.program), nivel: texto(exacta.level) };
  }
  const aprox = lista.find(
    (o) =>
      texto(o.group) === texto(sesion?.group) &&
      texto(o.period) === texto(sesion?.period) &&
      (texto(o.subject) === texto(sesion?.subject) || texto(o.subjectCode) === texto(sesion?.subjectCode)),
  );
  if (aprox) return { programa: texto(aprox.program), nivel: texto(aprox.level) };
  return { programa: "", nivel: "" };
}

export function buildActaPdf({ sesion = {}, registros = [], programa = "", nivel = "", facultad = "", cds = "", docente = "", docenteFirma = null, representanteFirma = null, representanteNombre = "", logo = null } = {}) {
  const filas = normalizarFilasEstudiantes(registros);
  /* Formato oficial fijo: 36 posiciones (1–24 y 25–36), con filas vacías
     si faltan registros. Más de 36 continúa en páginas solo-tabla extra
     para no perder ningún registro. */
  while (filas.length < 36) filas.push({ nombre: "", identificacion: "", firma: null, tipoFirma: null });
  const logoDoc = typeof logo === "string" ? { datos: logo } : logo;
  const grupos = [filas.slice(0, 24), filas.slice(24, 36)];
  for (let i = 36; i < filas.length; i += 24) grupos.push(filas.slice(i, i + 24));

  const datos = {
    facultad: texto(facultad),
    programa: texto(programa),
    nivel: texto(nivel),
    asignatura: texto(sesion?.subject),
    codigoAsignatura: texto(sesion?.subjectCode),
    periodo: texto(sesion?.period),
    cds: texto(cds),
    fecha: texto(sesion?.date),
    docente: texto(docente),
    temas: texto(sesion?.topics),
  };  const doc = new jsPDF({ unit: "mm", format: "legal", orientation: "portrait" });
  const rowH = 7;
  const totalPaginas = grupos.length;

  grupos.forEach((grupo, pagina) => {
    if (pagina > 0) doc.addPage("legal", "portrait");
    let y = TOP;
    if (pagina < 2) {
      /* Páginas 1 y 2: hoja oficial completa (encabezado + datos). */
      y = drawAttendanceHeader(doc, y, datos, logoDoc);
    }
    /* La tabla conserva cabecera de columnas en cada página y numeración
       global continua 1–24 / 25–36. */
    y = dibujarCabeceraTabla(doc, y);
    const inicio = pagina === 0 ? 1 : pagina === 1 ? 25 : 36 + (pagina - 1) * 24 + 1;
    y = drawStudentRows(doc, y, filas, inicio, inicio + grupo.length - 1, rowH);

    /* Firmas y control de cambios: solo al final del documento. La sección
       de firmas nunca se omite: si no cabe, continúa en página nueva. */
    if (pagina === totalPaginas - 1) {
      y += 8;
      if (y + 30 > BOTTOM) {
        doc.addPage("legal", "portrait");
        y = TOP;
      }
      const colW = (CONTENT_W - 24) / 2;
      dibujarFirma(doc, MX, y, colW, "FIRMA DEL DOCENTE", datos.docente, docenteFirma);
      dibujarFirma(doc, MX + colW + 24, y, colW, "FIRMA DEL REPRESENTANTE", representanteNombre, representanteFirma);
      y += 34;
      if (y + 30 > BOTTOM) {
        doc.addPage("legal", "portrait");
        y = TOP;
      }
      y = dibujarControlCambios(doc, y + 4);
      y = dibujarElaboro(doc, y + 6);
    }
  });

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    piePagina(doc, i, total);
  }
  return doc;
}

export function nombreArchivoActa(sesion) {
  const base = texto(sesion?.subject) || "acta";
  const seguro = base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `acta-F-GCA-24-${seguro || "asistencia"}.pdf`;
}

export async function downloadActaPdf(payload) {
  const logo = await cargarLogo();
  const doc = buildActaPdf({ ...payload, logo });
  doc.save(nombreArchivoActa(payload?.sesion));
}
