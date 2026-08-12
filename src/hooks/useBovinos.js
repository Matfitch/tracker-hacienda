import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { db } from '../lib/indexedDb';
import { alRecuperarDatos } from '../lib/sincronizacion';

// Respaldo por si el navegador/WebView no soporta crypto.randomUUID()
// (pasa en algunas versiones viejas de Android) — evita que la app truene.
function generarId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export function useBovinos() {
  const [bovinos, setBovinos] = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [partos, setPartos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [{ data: bData, error: bErr }, { data: aData, error: aErr }, { data: pData, error: pErr }] =
        await Promise.all([
          supabase.from('bovinos').select('*'),
          supabase.from('aplicaciones_protocolo').select('*'),
          supabase.from('partos').select('*'),
        ]);
      if (bErr) throw bErr;
      if (aErr) throw aErr;
      if (pErr) throw pErr;
      setBovinos(bData || []);
      setAplicaciones(aData || []);
      setPartos(pData || []);
      await db.bovinos.bulkPut(bData || []);
      await db.aplicaciones.bulkPut(aData || []);
      await db.partos.bulkPut(pData || []);
    } catch (e) {
      const [bLocal, aLocal, pLocal] = await Promise.all([
        db.bovinos.toArray(),
        db.aplicaciones.toArray(),
        db.partos.toArray(),
      ]);
      setBovinos(bLocal);
      setAplicaciones(aLocal);
      setPartos(pLocal);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => alRecuperarDatos(cargar), [cargar]);

  const guardarBovino = async (bovino) => {
    const existente = bovinos.find((b) => b.id === bovino.id);

    // Validación: no permitir un código duplicado (comparando con cualquier
    // OTRO animal, ignorando mayúsculas/espacios).
    if (bovino.codigo) {
      const duplicado = bovinos.find(
        (b) => b.id !== bovino.id && b.codigo?.trim().toLowerCase() === bovino.codigo.trim().toLowerCase()
      );
      if (duplicado) {
        throw new Error(`Ya existe un animal con el código "${bovino.codigo}" (${duplicado.nombre || duplicado.codigo}).`);
      }
    }

    const registro = {
      ...bovino,
      id: bovino.id || generarId(),
      // fecha_ingreso se fija UNA sola vez, al crear el animal, y nunca se
      // vuelve a tocar — sirve de referencia cuando no se conoce la fecha
      // real de nacimiento.
      fecha_ingreso: existente?.fecha_ingreso || bovino.fecha_ingreso || new Date().toISOString().slice(0, 10),
    };
    setBovinos((prev) => {
      const existe = prev.some((b) => b.id === registro.id);
      return existe ? prev.map((b) => (b.id === registro.id ? registro : b)) : [...prev, registro];
    });
    await db.bovinos.put(registro);

    try {
      const { error } = await supabase.from('bovinos').upsert(registro);
      if (error) throw error;
    } catch (e) {
      if (!navigator.onLine) {
        // Sin conexión: se guarda localmente y se reintenta más tarde, normal.
        await db.pendientes.add({ tipo: 'bovino', registro });
      } else {
        // Con conexión pero el servidor lo rechazó (ej. código duplicado que
        // otro dispositivo ya usó) — deshacemos el guardado local y avisamos.
        if (existente) {
          setBovinos((prev) => prev.map((b) => (b.id === registro.id ? existente : b)));
          await db.bovinos.put(existente);
        } else {
          setBovinos((prev) => prev.filter((b) => b.id !== registro.id));
          await db.bovinos.delete(registro.id);
        }
        throw new Error(
          e?.message?.includes('duplicate') || e?.code === '23505'
            ? `El código "${bovino.codigo}" ya está en uso.`
            : `No se pudo guardar: ${e?.message || e?.code || 'error desconocido'}`
        );
      }
    }
    return registro;
  };

  const registrarAplicacion = async (aplicacion) => {
    const registro = { ...aplicacion, id: aplicacion.id || generarId() };
    setAplicaciones((prev) => [...prev, registro]);
    await db.aplicaciones.put(registro);

    try {
      const { error } = await supabase.from('aplicaciones_protocolo').upsert(registro);
      if (error) throw error;
    } catch (e) {
      await db.pendientes.add({ tipo: 'aplicacion', registro });
    }
    return registro;
  };

  // Registra un parto completo: crea el registro en "partos", actualiza a la
  // madre (fecha_ultimo_parto, cierra la gestación), y opcionalmente crea de
  // una vez el animal de la cría, ya enlazado a su madre.
  const registrarParto = async ({ madre, fecha, sexoCria, crearCria, codigoCria, nombreCria, criaFallecida }) => {
    const numeroParto = partos.filter((p) => p.madre_id === madre.id).length + 1;

    let criaId = null;
    if (crearCria && codigoCria) {
      const cria = await guardarBovino({
        codigo: codigoCria,
        nombre: nombreCria,
        sexo: sexoCria,
        categoria: sexoCria === 'hembra' ? 'ternera' : 'ternero',
        fecha_nacimiento: fecha,
        madre_id: madre.id,
        estado: criaFallecida ? 'muerto' : 'activo',
        fecha_baja: criaFallecida ? fecha : null,
        uso_reproductivo: 'sin_definir',
      });
      criaId = cria.id;
    }

    const registroParto = {
      id: generarId(),
      madre_id: madre.id,
      numero_parto: numeroParto,
      fecha,
      sexo_cria: sexoCria,
      cria_bovino_id: criaId,
    };
    setPartos((prev) => [...prev, registroParto]);
    await db.partos.put(registroParto);
    try {
      const { error } = await supabase.from('partos').upsert(registroParto);
      if (error) throw error;
    } catch (e) {
      await db.pendientes.add({ tipo: 'parto', registro: registroParto });
    }

    // Actualiza a la madre: nueva fecha de parto, cierra la gestación actual
    await guardarBovino({ ...madre, fecha_ultimo_parto: fecha, fecha_inseminacion: null });

    return registroParto;
  };

  const eliminarBovino = async (id) => {
    setBovinos((prev) => prev.filter((b) => b.id !== id));
    await db.bovinos.delete(id);
    try {
      const { error } = await supabase.from('bovinos').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      await db.pendientes.add({ tipo: 'eliminar_bovino', id });
    }
  };

  const eliminarAplicacion = async (id) => {
    setAplicaciones((prev) => prev.filter((a) => a.id !== id));
    await db.aplicaciones.delete(id);
    try {
      const { error } = await supabase.from('aplicaciones_protocolo').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      await db.pendientes.add({ tipo: 'eliminar_aplicacion', id });
    }
  };

  const eliminarParto = async (id) => {
    setPartos((prev) => prev.filter((p) => p.id !== id));
    await db.partos.delete(id);
    try {
      const { error } = await supabase.from('partos').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      await db.pendientes.add({ tipo: 'eliminar_parto', id });
    }
  };

  return {
    bovinos,
    aplicaciones,
    partos,
    cargando,
    guardarBovino,
    registrarAplicacion,
    registrarParto,
    eliminarBovino,
    eliminarAplicacion,
    eliminarParto,
    recargar: cargar,
  };
}
