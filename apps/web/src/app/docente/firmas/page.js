/* Firmas del docente: reutiliza el SignaturePad existente. La firma se
   guarda una vez y queda disponible para las actas. */

"use client";

import { useState } from "react";
import { PenLine, ShieldCheck, Trash2 } from "lucide-react";
import {
  ChartCard,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Notice,
  Pill,
  ui,
} from "@/components/ui";
import SignaturePad from "@/components/SignaturePad";
import { useAcademy } from "@/features/shared/AcademyProvider";
import { PageHead } from "@/features/shared/PageHead";
import { docenteActual } from "@/features/shared/roleSelectors";

export default function FirmasPage() {
  const { db, saveSignature, remove } = useAcademy();
  const [confirmar, setConfirmar] = useState(null);

  const docente = docenteActual(db);
  const propias = db.firmas.filter((f) => f.personaId === docente?.personaId);
  const uso = propias.map((f) => ({
    firma: f,
    usos: db.records.filter((r) => r.firmaId === f.id).length,
  }));

  return (
    <>
      <PageHead
        eyebrow="Docencia"
        title="Mis firmas"
        sub="Firma digital reutilizable para las actas de asistencia."
      />

      <Notice tone="info" icon={ShieldCheck}>
        La firma se aplica a los registros que tú autorizas. Al firmar un acta, la evidencia queda
        asociada al docente y al periodo correspondiente.
      </Notice>

      <div className={ui.twoCol}>
        <ChartCard title="Firmar" sub="Dibuja, escribe o carga tu firma">
          <SignaturePad
            name={docente?.nombre ?? "Docente"}
            onConfirm={(firma) => {
              saveSignature(
                {
                  personaId: docente?.personaId ?? null,
                  nombre: firma?.nombre ?? docente?.nombre ?? "Docente",
                  tipo: firma?.tipo ?? "drawn",
                  data: firma?.data ?? null,
                },
                "docente",
              );
            }}
          />
        </ChartCard>

        <ChartCard title="Firmas guardadas" sub="Reutilizables en cualquier acta">
          {uso.length === 0 ? (
            <EmptyState
              icon={PenLine}
              title="Sin firmas"
              text="Dibuja tu firma para poder firmar actas de asistencia."
            />
          ) : (
            <ul className={ui.riskList}>
              {uso.map(({ firma, usos }) => (
                <li key={firma.id}>
                  <div>
                    <b>{firma.nombre}</b>
                    <span className={ui.cellMuted}>
                      Creada el {firma.creadaEn} · usada en {usos} registro(s)
                    </span>
                  </div>
                  <div>
                    <Pill tone={firma.vigente ? "ok" : "neutral"}>
                      {firma.vigente ? "Vigente" : "Revocada"}
                    </Pill>
                    <button
                      type="button"
                      className={ui.btnIcon}
                      aria-label={`Eliminar firma de ${firma.nombre}`}
                      onClick={() => setConfirmar(firma)}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>

      {uso.length > 0 ? (
        <ChartCard title="Detalle" sub="Uso de cada firma">
          <DataTable
            columns={[
              { key: "nombre", header: "Titular" },
              { key: "creadaEn", header: "Creada", muted: true },
              {
                key: "usos",
                header: "Registros",
                align: "right",
                render: (row) => row.usos,
              },
              {
                key: "vigente",
                header: "Estado",
                render: (row) => (
                  <Pill tone={row.firma.vigente ? "ok" : "neutral"}>
                    {row.firma.vigente ? "Vigente" : "Revocada"}
                  </Pill>
                ),
              },
            ]}
            rows={uso}
          />
        </ChartCard>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmar)}
        onClose={() => setConfirmar(null)}
        onConfirm={() => {
          remove("firmas")(confirmar.id, {
            modulo: "Firmas",
            accion: "Eliminó",
            entidad: confirmar.nombre,
            descripcion: "Firma eliminada del sistema.",
          }, "docente");
          setConfirmar(null);
        }}
        title="Eliminar firma"
        text="La firma dejará de estar disponible para nuevas actas. Los documentos ya firmados conservan su evidencia."
        confirmLabel="Eliminar"
        danger
        icon={Trash2}
      />
    </>
  );
}
