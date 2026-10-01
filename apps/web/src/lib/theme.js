"use client";

import { useCallback, useSyncExternalStore } from "react";

/* Almacén de tema como store externo: el atributo vive en <html> y el
   componente se suscribe con useSyncExternalStore. Así el tema se
   aplica antes del pintado y no requiere efectos con setState. */

const STORAGE_KEY = "asistencia-tema";
const EVENT = "asistencia:tema";

/* El script inline del layout ya aplicó el tema en <html> antes del
   pintado. El store debe arrancar desde ese mismo valor: si no, la
   primera hidratación de useTheme devolvería "light" con el DOM en
   "dark" y la interfaz quedaría desincronizada hasta el primer toggle. */
let snapshot = readDom();

function readDom() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(callback) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return "light";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = readDom() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    snapshot = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* modo privado: el tema solo dura la sesión */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const set = useCallback((value) => {
    document.documentElement.dataset.theme = value;
    snapshot = value;
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignorar */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { theme, toggle, set };
}
