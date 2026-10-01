"use client";

import { useState } from "react";
import { CheckCircle2, PenLine } from "lucide-react";
import SignaturePad from "@/components/SignaturePad";
import StudentHeader from "@/components/StudentHeader";
import { useStudent } from "@/prototype/StudentContext";
import styles from "./page.module.css";

function SavedView({ signature }) {
  if (signature.kind === "typed") {
    return <span className={styles.sigTyped}>{signature.data}</span>;
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={signature.data} alt="Mi firma guardada" className={styles.sigImg} />
  );
}

/* Firma propia del estudiante con los tres métodos disponibles. */
export default function FirmaContent() {
  const { profile, signature, setSignature } = useStudent();
  const [saved, setSaved] = useState(false);

  function save(next) {
    setSignature(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 4000);
  }

  return (
    <div className={styles.content}>
      <StudentHeader
        title="Mi firma"
        subtitle="Tu firma puede utilizarse en el registro oficial de asistencia."
      />

      {saved && (
        <p className={styles.saved} role="status">
          <CheckCircle2 aria-hidden="true" />
          Firma guardada. Se asociará a tus próximos registros.
        </p>
      )}

      <section className={styles.card} aria-label="Gestionar mi firma">
        <SignaturePad name={profile.name} onConfirm={save} />
      </section>

      {signature && (
        <section className={styles.card} aria-label="Firma actual">
          <h2 className={styles.savedTitle}>
            <PenLine aria-hidden="true" />
            Firma actual
          </h2>
          <SavedView signature={signature} />
        </section>
      )}
    </div>
  );
}
