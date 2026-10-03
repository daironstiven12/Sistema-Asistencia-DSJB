/* Estado de Instituciones contra la API real (sin mock).
   Búsqueda con debounce, banderas de carga/ocupado para evitar doble envío,
   y actualización local de la lista tras cada mutación. */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { institutionsApi } from "@/services/api/institutions";
import { ApiError } from "@/services/api/http";

export function useInstitutionsApi() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const seq = useRef(0);

  const cargar = useCallback(async (q) => {
    const n = ++seq.current;
    setCargando(true);
    setError(null);
    try {
      const data = await institutionsApi.list({ q });
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
    const t = setTimeout(() => cargar(query), 350);
    return () => clearTimeout(t);
  }, [query, cargar]);

  const reintentar = useCallback(() => cargar(query), [cargar, query]);

  const crear = useCallback(async (values) => {
    setOcupado(true);
    setError(null);
    try {
      const row = await institutionsApi.create(values);
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
      const row = await institutionsApi.update(id, values);
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
      const updated = await institutionsApi.setStatus(row.id, siguiente);
      setFilas((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
      return true;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error inesperado al cambiar estado.");
      return false;
    } finally {
      setOcupado(false);
    }
  }, []);

  return { filas, cargando, error, query, setQuery, ocupado, reintentar, crear, editar, cambiarEstado };
}
