"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { studentProfile } from "./studentProfile";

const StudentContext = createContext(null);

export { studentProfile };

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
