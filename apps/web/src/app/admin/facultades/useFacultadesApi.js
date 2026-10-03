/* Estado de Facultades contra la API real (sin mock).
   Búsqueda con debounce + filtro por institución (combinables),
   instituciones reales para el selector, banderas de carga/ocupado y
   actualización local tras cada mutación. */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { facultadesApi } from "@/services/api/facultades";
import { institutionsApi } from "@/services/api/institutions";
import { ApiError } from "@/services/api/http";

export function useFacultadesApi() {
  const [filas, setFilas] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [institucionId, setInstitucionId] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const seq = useRef(0);

  const cargar = useCallback(async (q, instId) => {
    const n = ++seq.current;
    setCargando(true);
    setError(null);
    try {
      const data = await facultadesApi.list({ institutionId: instId || undefined, q });
      if (seq.current === n) setFilas(data);
    } catch (e) {
      if (seq.current === n) {
        setError(e instanceof ApiError ? e.message : "Error inesperado al cargar.");
      }
    } finally {
      if (seq.current === n) setCargando(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => cargar(query, institucionId), 350);
    return () => clearTimeout(t);
  }, [query, institucionId, cargar]);

  /* Instituciones reales para el selector y los nombres (una sola carga). */
  useEffect(() => {
    let viva = true;
    institutionsApi
      .list({})
      .then((data) => {
        if (viva) setInstituciones(data);
      })
      .catch(() => {
        /* Si falla, el selector queda vacío y el error principal lo muestra la lista. */
      });
    return () => {
      viva = false;
    };
  }, []);

  const reintentar = useCallback(() => cargar(query, institucionId), [cargar, query, institucionId]);

  const crear = useCallback(async (values) => {
    setOcupado(true);
    setError(null);
    try {
      const row = await facultadesApi.create(values);
      setFilas((prev) => [row, ...prev]);
      return true;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error inesperado al crear.");
      return false;
    } finally {
      setOcupado(false);
    }
  }, []);

  const editar = useCallback(async (id, values) => {
    setOcupado(true);
    setError(null);
    try {
      const row = await facultadesApi.update(id, values);
      setFilas((prev) => prev.map((r) => (r.id === id ? row : r)));
      return true;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error inesperado al guardar.");
      return false;
    } finally {
      setOcupado(false);
    }
  }, []);

  const cambiarEstado = useCallback(async (row) => {
    const siguiente = row.estado === "Activo" ? "Inactivo" : "Activo";
    setOcupado(true);
    setError(null);
    try {
      const updated = await facultadesApi.setStatus(row.id, siguiente);
      setFilas((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
      return true;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error inesperado al cambiar estado.");
      return false;
    } finally {
      setOcupado(false);
    }
  }, []);

  return {
    filas,
    instituciones,
    cargando,
    error,
    query,
    setQuery,
    institucionId,
    setInstitucionId,
    ocupado,
    reintentar,
    crear,
    editar,
    cambiarEstado,
  };
}
