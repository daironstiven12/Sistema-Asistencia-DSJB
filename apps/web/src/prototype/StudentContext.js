"use client";

import { createContext, useContext, useMemo, useState } from "react";

const StudentContext = createContext(null);

/* Estudiante mock: pertenece al grupo activo del período activo. */
export const studentProfile = {
  key: "seed-8",
  name: "Jeanpier Polanco",
  idNumber: "1077488001",
  email: "jeanpier.polanco@utch.edu.co",
  program: "Ingeniería de Telecomunicaciones e Informática",
  level: "VII",
  group: "VII - A",
  period: "2026-2",
  initials: "JP",
};

export function StudentProvider({ children }) {
  const [signature, setSignature] = useState(null);
  const [seenCount, setSeenCount] = useState(0);

  const value = useMemo(
    () => ({
      profile: studentProfile,
      signature,
      setSignature,
      seenCount,
      markSeen: (total) => setSeenCount(total),
    }),
    [signature, seenCount],
  );

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent requiere StudentProvider.");
  return ctx;
}
