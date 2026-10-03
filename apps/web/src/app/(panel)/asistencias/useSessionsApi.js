/* Hooks de asistencias contra la API real (sin mock).
   useMySessions: lista del representante + recarga.
   useSessionDetail: sesión + registros + abrir/cerrar/firmar con
   banderas de ocupado, errores visibles y refresco desde la API. */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { attendanceApi } from "@/services/api/attendance";
import { ApiError } from "@/services/api/http";

function mensaje(e, defecto) {
  return e instanceof ApiError ? e.message : defecto;
}

export function useMySessions() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const viva = useRef(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await attendanceApi.list();
      if (viva.current) setFilas(data);
    } catch (e) {
      if (viva.current) setError(mensaje(e, "Error inesperado al cargar."));
    } finally {
      if (viva.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    viva.current = true;
    const t = setTimeout(() => {
      void cargar();
    }, 0);
    return () => {
      viva.current = false;
      clearTimeout(t);
    };
  }, [cargar]);

  return { filas, cargando, error, recargar: cargar };
}

export function useSessionDetail(id) {
  const [sesion, setSesion] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const viva = useRef(true);

  const cargar = useCallback(async () => {
    if (!id) return;
    setCargando(true);
    setError(null);
    try {
      const [s, r] = await Promise.all([
        attendanceApi.get(id),
        attendanceApi.records(id).catch(() => []),
      ]);
      if (!viva.current) return;
      setSesion(s);
      setRegistros(r);
    } catch (e) {
      if (viva.current) setError(mensaje(e, "Error inesperado al cargar."));
    } finally {
      if (viva.current) setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    viva.current = true;
    const t = setTimeout(() => {
      void cargar();
    }, 0);
    return () => {
      viva.current = false;
      clearTimeout(t);
    };
  }, [cargar]);

  const ejecutar = useCallback(
    async (fn, defecto) => {
      if (ocupado) return false;
      setOcupado(true);
      setError(null);
      try {
        await fn();
        await cargar();
        return true;
      } catch (e) {
        if (viva.current) setError(mensaje(e, defecto));
        return false;
      } finally {
        if (viva.current) setOcupado(false);
      }
    },
    [cargar, ocupado],
  );

  const abrir = useCallback(() => ejecutar(() => attendanceApi.open(id), "No se pudo abrir."), [ejecutar, id]);
  const cerrar = useCallback(() => ejecutar(() => attendanceApi.close(id), "No se pudo cerrar."), [ejecutar, id]);
  const firmar = useCallback(
    (firma) => ejecutar(() => attendanceApi.sign(id, firma), "No se pudo firmar."),
    [ejecutar, id],
  );

  /* Variante para modales: devuelve el resultado sin fijar el error global,
     de modo que el error se muestre en el modal y no como texto suelto. */
  const realizar = useCallback(
    async (fn) => {
      if (ocupado) return { ok: false, error: null, bloqueado: true };
      setOcupado(true);
      try {
        const dato = await fn();
        await cargar();
        return { ok: true, dato, error: null };
      } catch (e) {
        return { ok: false, dato: null, error: e };
      } finally {
        if (viva.current) setOcupado(false);
      }
    },
    [cargar, ocupado],
  );

  const guardarTemas = useCallback(
    (topics) => realizar(() => attendanceApi.updateTopics(id, topics)),
    [realizar, id],
  );

  /* Recarga silenciosa (sin estado de carga): para refrescar registros
     mientras la sesión está abierta, sin parpadeos en la interfaz. */
  const actualizar = useCallback(async () => {
    if (!id) return;
    try {
      const [s, r] = await Promise.all([
        attendanceApi.get(id),
        attendanceApi.records(id).catch(() => []),
      ]);
      if (!viva.current) return;
      setSesion(s);
      setRegistros(r);
    } catch {
      /* silencioso: se conserva lo último cargado */
    }
  }, [id]);

  return { sesion, registros, cargando, error, ocupado, recargar: cargar, abrir, cerrar, firmar, realizar, guardarTemas, actualizar };
}
