"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./ui.module.css";

/* Paleta categórica de los gráficos. Derivada de los tokens semánticos. */
export const CHART_COLORS = {
  accent: "var(--accent)",
  ok: "var(--accent)",
  info: "var(--info-fg)",
  warn: "var(--warn-fg)",
  danger: "var(--danger-fg)",
  teal: "var(--teal-fg)",
  neutral: "var(--border-3)",
  surface: "var(--surface-3)",
};

/* Tarja estándar de gráfico. */
export function ChartCard({ title, sub, actions, children, className = "" }) {
  return (
    <section className={`${styles.chartCard} ${className}`}>
      <div className={styles.cardHead}>
        <div>
          <h2 className={styles.chartTitle}>{title}</h2>
          {sub ? <p className={styles.chartSub}>{sub}</p> : null}
        </div>
        {actions ? <div className={styles.toolbarSpacer}>{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Legend({ items }) {
  return (
    <ul className={styles.chartLegend}>
      {items.map((item) => (
        <li key={item.label}>
          <i
            className={styles.swatch}
            style={{ background: item.color }}
            aria-hidden="true"
          />
          {item.label}
          {item.value != null ? (
            <span className={styles.legendValue}>{item.value}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/* Dona: conic-gradient + hueco central. Sin librería. */
export function Donut({ value, total, label = "de asistencia", caption, segments, hideLegend }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
   /* El cursor del gradiente se lleva aparte: si se leyera del acumulador
      se concatenaría con el string anterior y el degrade quedaría inválido. */
  let cursor = 0;
  const stops = segments?.length
    ? segments.flatMap((segment) => {
        const from = cursor;
        const to = from + (total > 0 ? (segment.value / total) * 100 : 0);
        cursor = to;
        return [`${segment.color} ${from}% ${to}%`];
      })
    : [`var(--accent) 0 ${pct}%`, `var(--surface-3) ${pct}% 100%`];

  return (
    <div className={styles.donutRow}>
      <div
        className={styles.donut}
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
        role="img"
        aria-label={caption ?? `${pct} por ciento de ${label}`}
      >
        <div className={styles.donutHole}>
          <div>
            <div className={styles.donutValue}>{pct}%</div>
            <div className={styles.donutLabel}>{label}</div>
          </div>
        </div>
      </div>
      {segments?.length && !hideLegend ? (
        <Legend items={segments.map((s) => ({ ...s }))} />
      ) : null}
    </div>
  );
}

/* Barras horizontales con etiqueta, barra y valor. */
export function HBars({ rows, colorOf }) {
  return (
    <div className={styles.hbars}>
      {rows.map((row) => (
        <div key={row.label} className={styles.hbar}>
          <span className={styles.hbarLabel} title={row.label}>
            {row.label}
          </span>
          <div className={styles.hbarTrack}>
            <i
              className={styles.hbarFill}
              style={{
                width: `${Math.max(0, Math.min(100, row.value))}%`,
                background: colorOf ? colorOf(row) : undefined,
              }}
            />
          </div>
          <b className={styles.hbarValue}>
            {row.display ?? `${row.value}%`}
          </b>
        </div>
      ))}
    </div>
  );
}

/* Columnas apiladas: composición por categoría sobre el total. */
export function StackedColumns({ columns, colors, max }) {
  const peak = max ?? Math.max(1, ...columns.map((c) => c.total));
  return (
    <div className={styles.columns}>
      {columns.map((column) => (
        <div key={column.label} className={styles.column}>
          <div className={styles.columnSlot}>
            <span className={styles.columnValue}>
              {column.display ?? column.total}
            </span>
            <div
              className={styles.columnStack}
              style={{ height: `${(column.total / peak) * 128}px` }}
            >
              {column.parts.map((part) => (
                <i
                  key={part.key}
                  className={styles.columnSeg}
                  style={{
                    height: `${(part.value / peak) * 128}px`,
                    background: colors[part.key],
                  }}
                  title={`${part.label}: ${part.value}`}
                />
              ))}
            </div>
          </div>
          <span className={styles.columnLabel} style={{ left: "50%" }}>
            {column.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* Paso de escala "bonito" (1, 2, 2.5, 5, 10 × 10^n). */
function pasoBonito(x) {
  const exp = Math.floor(Math.log10(Math.max(x, 1e-9)));
  const base = 10 ** exp;
  const norm = x / base;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return step * base;
}

/* Línea temporal: trayectoria de una métrica por jornada.
   Componentes: área + trazo, valores sobre cada punto, carril de volumen
   (registros por jornada) y líneas de referencia (promedio y umbral).
   El ancho se mide al contenedor para que el SVG ocupe el 100% de la tarjeta
   sin escalado ni texto deformado. */
export function LineChart({
  points,
  height = 258,
  initialWidth = 900,
  yMax,
  yMin,
  average,
  threshold,
  averageLabel = "Promedio",
  thresholdLabel = "Umbral",
  unit = "%",
  legend = true,
}) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(initialWidth);
  const gradId = `lineFill${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0]?.contentRect?.width ?? 0);
      if (next > 0) setWidth(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!points || points.length === 0) return null;

  const padL = 46;
  const padR = 18;
  const padT = 34;
  const laneH = 26;
  const laneGap = 10;
  const labelH = 20;
  const padB = laneH + laneGap + labelH;
  const plotBottom = height - padB;
  const laneTop = plotBottom + laneGap;

  const values = points.map((point) => point.value);
  const refs = [average, threshold].filter(
    (value) => typeof value === "number" && Number.isFinite(value),
  );
  const dataMax = yMax ?? Math.max(...values, ...refs);
  const dataMin = yMin ?? Math.min(...values, ...refs);
  const span = Math.max(dataMax - dataMin, dataMax * 0.1, 1);
  const paso = pasoBonito(span / 3);
  let lo = Math.max(0, Math.floor((dataMin - span * 0.25) / paso) * paso);
  let hi = Math.ceil((dataMax + span * 0.25) / paso) * paso;
  if (hi <= lo) hi = lo + paso;

  /* Una referencia que queda cerca del rango amplía la escala para que se
     vea; si está demasiado lejos se omite en vez de aplastar la curva. */
  refs.forEach((value) => {
    if (value < lo && value >= lo - span * 0.6) lo = Math.max(0, Math.floor(value / paso) * paso);
    if (value > hi && value <= hi + span * 0.6) hi = Math.ceil(value / paso) * paso;
  });
  if (hi <= lo) hi = lo + paso;

  const ticks = [];
  for (let v = lo; v <= hi + 1e-6; v += paso) ticks.push(Math.round(v * 100) / 100);

  const stepX = (width - padL - padR) / Math.max(1, points.length - 1);
  const yDe = (value) => padT + (1 - (value - lo) / (hi - lo)) * (plotBottom - padT);
  const coords = points.map((point, index) => ({
    x: padL + index * stepX,
    y: yDe(point.value),
    ...point,
  }));

  const line =
    coords.length > 1
      ? coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ")
      : `M${coords[0].x - 1},${coords[0].y} L${coords[0].x + 1},${coords[0].y}`;
  const area =
    coords.length > 1
      ? `${line} L${coords.at(-1).x},${plotBottom} L${coords[0].x},${plotBottom} Z`
      : null;

  const conVolumen = points.some((p) => typeof p.total === "number" && p.total > 0);
  const maxVol = Math.max(1, ...points.map((p) => p.total ?? 0));
  const barW = Math.max(8, Math.min(34, stepX * 0.44));

  const enRango = (v) => typeof v === "number" && v >= lo && v <= hi;
  const strideValor = points.length <= 14 ? 1 : Math.ceil(points.length / 10);
  const strideEje = points.length <= 16 ? 1 : Math.ceil(points.length / 12);
  const verValor = (i) => i % strideValor === 0 || i === coords.length - 1;
  const verEje = (i) => i % strideEje === 0 || i === coords.length - 1;

  const itemsLeyenda = [
    { clase: styles.lineLegendLine, texto: `Asistencia (${points.length} jornadas)` },
    ...(conVolumen ? [{ clase: styles.lineLegendBar, texto: "Registros por jornada" }] : []),
    ...(enRango(average) && average != null
      ? [{ clase: styles.lineLegendAvg, texto: `${averageLabel} ${average}${unit}` }]
      : []),
    ...(enRango(threshold) && threshold != null
      ? [{ clase: styles.lineLegendThr, texto: `${thresholdLabel} de riesgo ${threshold}${unit}` }]
      : []),
  ];

  /* Cajas aproximadas de las etiquetas: la de referencia se dibuja solo si
     no cae encima de un valor ni de otra referencia. La línea de todos modos
     aparece y la leyenda inferior conserva el dato. */
  const choque = (a, b) =>
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

  const cajasValores = coords
    .filter((_, index) => verValor(index))
    .map((c) => {
      const texto = c.display ?? `${c.value}${unit}`;
      const y = Math.max(c.y - 12, padT - 14);
      const w = texto.length * 6.4 + 8;
      return { left: c.x - w / 2, right: c.x + w / 2, top: y - 9, bottom: y + 3 };
    });

  const cajasRefs = [];

  const referencia = (valor, claseLinea, claseTexto, texto) => {
    if (!enRango(valor)) return null;
    const y = yDe(valor);
    const w = texto.length * 6 + 8;
    const right = width - padR - 4;
    const caja = { left: right - w, right, top: y - 15, bottom: y - 3 };
    const tapada =
      cajasValores.some((valorCaja) => choque(caja, valorCaja)) ||
      cajasRefs.some((refCaja) => choque(caja, refCaja));
    if (!tapada) cajasRefs.push(caja);
    return (
      <g key={texto}>
        <line className={claseLinea} x1={padL} x2={width - padR} y1={y} y2={y} />
        {tapada ? null : (
          <text className={claseTexto} x={right} y={y - 6} textAnchor="end">
            {texto}
          </text>
        )}
      </g>
    );
  };

  return (
    <div ref={wrapRef} className={styles.lineChartWrap}>
      <svg
        className={styles.lineChart}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Tendencia de asistencia en ${points.length} jornadas${
          average != null ? `, promedio ${average}${unit}` : ""
        }${threshold != null ? `, umbral ${threshold}${unit}` : ""}`}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Rejilla + escala Y. El tick superior lleva la unidad. */}
        {ticks.map((tick, i) => (
          <g key={tick}>
            <line
              className={styles.lineGridLine}
              x1={padL}
              x2={width - padR}
              y1={yDe(tick)}
              y2={yDe(tick)}
            />
            <text className={styles.lineTick} x={padL - 9} y={yDe(tick) + 3.5} textAnchor="end">
              {i === ticks.length - 1 ? `${tick}${unit}` : tick}
            </text>
          </g>
        ))}

        {/* Carril de volumen: cuántos registros sostienen cada porcentaje. */}
        {conVolumen ? (
          <g>
            <line
              className={styles.lineLaneAxis}
              x1={padL}
              x2={width - padR}
              y1={laneTop + laneH}
              y2={laneTop + laneH}
            />
            {coords.map((c, index) => {
              const registros = c.total ?? 0;
              const h = (registros / maxVol) * laneH;
              return (
                <rect
                  key={`vol-${c.label}`}
                  className={styles.lineBar}
                  x={c.x - barW / 2}
                  y={laneTop + laneH - h}
                  width={barW}
                  height={Math.max(2, h)}
                  rx={2}
                  style={{ animationDelay: `${420 + index * 55}ms` }}
                >
                  <title>{`${c.label}: ${registros} registros`}</title>
                </rect>
              );
            })}
          </g>
        ) : null}

        {referencia(
          threshold,
          styles.lineRefThr,
          `${styles.lineRefLabel} ${styles.lineRefLabelThr}`,
          `${thresholdLabel} ${threshold}${unit}`,
        )}
        {referencia(
          average,
          styles.lineRef,
          styles.lineRefLabel,
          `${averageLabel} ${average}${unit}`,
        )}

        <line className={styles.lineAxis} x1={padL} x2={width - padR} y1={plotBottom} y2={plotBottom} />
        {area ? <path className={styles.lineArea} d={area} fill={`url(#${gradId})`} /> : null}
        <path className={styles.linePath} d={line} pathLength={1} />

        {coords.map((c, index) => (
          <g key={c.label} className={styles.lineDot}>
            <circle
              className={styles.linePoint}
              cx={c.x}
              cy={c.y}
              r={4.5}
              style={{ animationDelay: `${460 + index * 70}ms` }}
            >
              <title>{`${c.label}: ${c.display ?? `${c.value}${unit}`}${
                conVolumen ? ` · ${c.total} registros` : ""
              }`}</title>
            </circle>
            {verValor(index) ? (
              <text
                className={styles.lineValue}
                x={c.x}
                y={Math.max(c.y - 12, padT - 14)}
                textAnchor="middle"
                style={{ animationDelay: `${640 + index * 70}ms` }}
              >
                {c.display ?? `${c.value}${unit}`}
              </text>
            ) : null}
            {verEje(index) ? (
              <text
                className={styles.lineLabel}
                x={points.length === 1 ? padL : c.x}
                y={height - 6}
                textAnchor={points.length === 1 ? "start" : "middle"}
              >
                {c.label}
              </text>
            ) : null}
          </g>
        ))}
      </svg>

      {legend ? (
        <ul className={styles.lineLegend}>
          {itemsLeyenda.map((item) => (
            <li key={item.texto}>
              <i className={item.clase} aria-hidden="true" />
              {item.texto}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* Micro-barra de tendencia para tarjetas KPI. */
export function Sparkbars({ values, max }) {
  const peak = max ?? Math.max(1, ...values);
  return (
    <div className={styles.sparkBars} aria-hidden="true">
      {values.map((value, index) => (
        <i
          key={index}
          className={`${styles.sparkBar} ${value / peak > 0.75 ? styles.sparkBarOn : ""}`}
          style={{ height: `${Math.max(2, (value / peak) * 26)}px` }}
        />
      ))}
    </div>
  );
}
