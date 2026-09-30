"use client";

import { useRef, useState } from "react";
import { Check, ImagePlus, PenLine, Type } from "lucide-react";
import styles from "./SignaturePad.module.css";

const TABS = [
  { key: "draw", label: "Dibujar", icon: PenLine },
  { key: "type", label: "Escribir", icon: Type },
  { key: "upload", label: "Cargar", icon: ImagePlus },
];

/* Captura de firma solo en frontend. `onConfirm` recibe { kind, data }.
   Con mode="upload", solo permite cargar una imagen ya proporcionada. */
export default function SignaturePad({ name, mode = "full", onConfirm }) {
  const [tab, setTab] = useState(mode === "upload" ? "upload" : "draw");
  const [typed, setTyped] = useState(name);
  const [preview, setPreview] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const canvasRef = useRef(null);

  function canvasPos(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    return {
      x: ((point.clientX - rect.left) / rect.width) * canvas.width,
      y: ((point.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function startDraw(event) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = canvasPos(event);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
    setPreview(null);
  }

  function moveDraw(event) {
    if (!drawing) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = canvasPos(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function endDraw() {
    if (!drawing) return;
    setDrawing(false);
    setPreview(canvasRef.current.toDataURL("image/png"));
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setPreview(null);
  }

  function readFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  function confirm() {
    if (tab === "draw" && !preview) return;
    if (tab === "type" && !typed.trim()) return;
    if (tab === "upload" && !preview) return;
    onConfirm({
      kind: tab,
      data: tab === "type" ? typed.trim() : preview,
    });
  }

  const canConfirm =
    (tab === "draw" && preview) ||
    (tab === "type" && typed.trim()) ||
    (tab === "upload" && preview);

  return (
    <div className={styles.pad}>
      <div className={styles.tabs} role="tablist" aria-label="Método de firma">
        {TABS.filter(({ key }) => mode === "full" || key === "upload").map(
          ({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`${styles.tab} ${tab === key ? styles.tabActive : ""}`}
              onClick={() => {
                setTab(key);
                setPreview(null);
              }}
            >
              <Icon aria-hidden="true" />
              {label}
            </button>
          ),
        )}
      </div>

      {tab === "draw" && (
        <div>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width={520}
            height={180}
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={moveDraw}
            onTouchEnd={endDraw}
          />
          <button
            type="button"
            className={styles.linkBtn}
            onClick={clearCanvas}
          >
            Limpiar trazo
          </button>
        </div>
      )}

      {tab === "type" && (
        <div>
          <label className={styles.label} htmlFor={`sig-type-${name}`}>
            Nombre para la firma
          </label>
          <input
            id={`sig-type-${name}`}
            className={styles.input}
            type="text"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="Escribe tu nombre completo"
          />
          {typed.trim() && (
            <p className={styles.typed} aria-label="Vista previa de la firma">
              {typed.trim()}
            </p>
          )}
        </div>
      )}

      {tab === "upload" && (
        <div>
          <label className={styles.upload} htmlFor={`sig-file-${name}`}>
            <ImagePlus aria-hidden="true" />
            Seleccionar imagen de la firma
          </label>
          <input
            id={`sig-file-${name}`}
            className={styles.fileInput}
            type="file"
            accept="image/*"
            onChange={readFile}
          />
          <p className={styles.hint}>La imagen no se sube a ningún servidor.</p>
        </div>
      )}

      {preview && tab !== "type" && (
        <div className={styles.previewBox}>
          <span className={styles.previewLabel}>Vista previa</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Vista previa de la firma" className={styles.previewImg} />
        </div>
      )}

      <button
        type="button"
        className={styles.btnPrimary}
        disabled={!canConfirm}
        onClick={confirm}
      >
        <Check aria-hidden="true" />
        Confirmar firma
      </button>
    </div>
  );
}
