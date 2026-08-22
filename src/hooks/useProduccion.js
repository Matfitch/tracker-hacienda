import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { db } from '../lib/indexedDb';

export function useProduccion(mesKey) {
  const [registros, setRegistros] = useState({});
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('produccion_leche')
        .select('*')
        .gte('fecha', `${mesKey}-01`)
        .lte('fecha', `${mesKey}-31`);
      if (error) throw error;
      const mapa = {};
      data.forEach((r) => { mapa[r.fecha] = { manana: r.manana, tarde: r.tarde }; });
      setRegistros(mapa);
      await db.produccion.bulkPut(data);
    } catch (e) {
      const local = await db.produccion.toArray();
      const mapa = {};
      local.filter((r) => r.fecha.startsWith(mesKey))
        .forEach((r) => { mapa[r.fecha] = { manana: r.manana, tarde: r.tarde }; });
      setRegistros(mapa);
    } finally {
      setCargando(false);
    }
  }, [mesKey]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardarDia = async (fecha, manana, tarde) => {
    setRegistros((prev) => ({ ...prev, [fecha]: { manana, tarde } }));
    await db.produccion.put({ fecha, manana, tarde });

    try {
      const { error } = await supabase
        .from('produccion_leche')
        .upsert({ fecha, manana, tarde }, { onConflict: 'fecha' });
      if (error) throw error;
    } catch (e) {
      await db.pendientes.add({ tipo: 'produccion', fecha, manana, tarde });
    }
  };

  return { registros, cargando, guardarDia, recargar: cargar };
}

export function useProduccionRango(fechaInicio, fechaFin) {
  const [registros, setRegistros] = useState({});
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('produccion_leche')
        .select('*')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin);
      if (error) throw error;
      const mapa = {};
      data.forEach((r) => { mapa[r.fecha] = { manana: r.manana, tarde: r.tarde }; });
      setRegistros(mapa);
      await db.produccion.bulkPut(data);
    } catch (e) {
      const local = await db.produccion.toArray();
      const mapa = {};
      local
        .filter((r) => r.fecha >= fechaInicio && r.fecha <= fechaFin)
        .forEach((r) => { mapa[r.fecha] = { manana: r.manana, tarde: r.tarde }; });
      setRegistros(mapa);
    } finally {
      setCargando(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => { cargar(); }, [cargar]);

  const totalLitros = Object.values(registros).reduce(
    (acc, r) => acc + (Number(r.manana) || 0) + (Number(r.tarde) || 0),
    0
  );

  return { registros, cargando, totalLitros, recargar: cargar };
}