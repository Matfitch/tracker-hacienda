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

const CONFIG_DEFECTO = { id: 1, precio_leche: 0.5, consumo_interno_litros_dia: 0 };

export function useFinanzas() {
  const [movimientos, setMovimientos] = useState([]);
  const [config, setConfig] = useState(CONFIG_DEFECTO);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [{ data: mData, error: mErr }, { data: cData, error: cErr }] = await Promise.all([
        supabase.from('finanzas_movimientos').select('*'),
        supabase.from('finanzas_config').select('*').eq('id', 1).maybeSingle(),
      ]);
      if (mErr) throw mErr;
      if (cErr) throw cErr;
      setMovimientos(mData || []);
      setConfig(cData || CONFIG_DEFECTO);
      await db.finanzas.bulkPut(mData || []);
      if (cData) await db.finanzasConfig.put(cData);
    } catch (e) {
      const [mLocal, cLocal] = await Promise.all([
        db.finanzas.toArray(),
        db.finanzasConfig.get(1),
      ]);
      setMovimientos(mLocal);
      setConfig(cLocal || CONFIG_DEFECTO);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => alRecuperarDatos(cargar), [cargar]);

  const guardarMovimiento = async (movimiento) => {
    const registro = {
      ...movimiento,
      id: movimiento.id || generarId(),
      // Si no se especifica un mes contable explícito, se infiere del año-mes de la fecha
      mes_contable: movimiento.mes_contable || (movimiento.fecha ? movimiento.fecha.slice(0, 7) : null),
    };
    setMovimientos((prev) => {
      const existe = prev.some((m) => m.id === registro.id);
      return existe ? prev.map((m) => (m.id === registro.id ? registro : m)) : [...prev, registro];
    });
    await db.finanzas.put(registro);
    try {
      const { error } = await supabase.from('finanzas_movimientos').upsert(registro);
      if (error) throw error;
    } catch (e) {
      await db.pendientes.add({ tipo: 'finanza', registro });
    }
    return registro;
  };

  const eliminarMovimiento = async (id) => {
    setMovimientos((prev) => prev.filter((m) => m.id !== id));
    await db.finanzas.delete(id);
    try {
      const { error } = await supabase.from('finanzas_movimientos').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      await db.pendientes.add({ tipo: 'eliminar_finanza', id });
    }
  };

  const guardarConfig = async (cambios) => {
    const registro = { ...config, ...cambios, id: 1 };
    setConfig(registro);
    await db.finanzasConfig.put(registro);
    try {
      const { error } = await supabase.from('finanzas_config').upsert(registro);
      if (error) throw error;
    } catch (e) {
      await db.pendientes.add({ tipo: 'finanzas_config', registro });
    }
  };

  return { movimientos, config, cargando, guardarMovimiento, eliminarMovimiento, guardarConfig, recargar: cargar };
}
