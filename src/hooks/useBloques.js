import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { db } from '../lib/indexedDb';
import { alRecuperarDatos } from '../lib/sincronizacion';

function generarId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export function useBloques() {
  const [bloques, setBloques] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [{ data: bData, error: bErr }, { data: eData, error: eErr }] = await Promise.all([
        supabase.from('bloques').select('*'),
        supabase.from('eventos_bloque').select('*'),
      ]);
      if (bErr) throw bErr;
      if (eErr) throw eErr;
      setBloques(bData || []);
      setEventos(eData || []);
      await db.bloques.bulkPut(bData || []);
      await db.eventosBloque.bulkPut(eData || []);
    } catch (e) {
      const [bLocal, eLocal] = await Promise.all([
        db.bloques.toArray(),
        db.eventosBloque.toArray(),
      ]);
      setBloques(bLocal);
      setEventos(eLocal);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => alRecuperarDatos(cargar), [cargar]);

  const guardarBloque = async (bloque) => {
    const registro = { ...bloque, id: bloque.id || generarId() };
    setBloques((prev) => {
      const existe = prev.some((b) => b.id === registro.id);
      return existe ? prev.map((b) => (b.id === registro.id ? registro : b)) : [...prev, registro];
    });
    await db.bloques.put(registro);
    try {
      const { error } = await supabase.from('bloques').upsert(registro);
      if (error) throw error;
    } catch (e) {
      await db.pendientes.add({ tipo: 'bloque', registro });
    }
    return registro;
  };

  const eliminarBloque = async (id) => {
    setBloques((prev) => prev.filter((b) => b.id !== id));
    await db.bloques.delete(id);
    try {
      const { error } = await supabase.from('bloques').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      await db.pendientes.add({ tipo: 'eliminar_bloque', id });
    }
  };

  const registrarEvento = async (evento) => {
    const registro = { ...evento, id: evento.id || generarId() };
    setEventos((prev) => [...prev, registro]);
    await db.eventosBloque.put(registro);
    try {
      const { error } = await supabase.from('eventos_bloque').upsert(registro);
      if (error) throw error;
    } catch (e) {
      await db.pendientes.add({ tipo: 'evento_bloque', registro });
    }
    return registro;
  };

  const eliminarEvento = async (id) => {
    setEventos((prev) => prev.filter((e) => e.id !== id));
    await db.eventosBloque.delete(id);
    try {
      const { error } = await supabase.from('eventos_bloque').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      await db.pendientes.add({ tipo: 'eliminar_evento_bloque', id });
    }
  };

  return { bloques, eventos, cargando, guardarBloque, eliminarBloque, registrarEvento, eliminarEvento, recargar: cargar };
}
