import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { db } from '../lib/indexedDb';
import { alRecuperarDatos } from '../lib/sincronizacion';

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
    const registro = { ...bovino, id: bovino.id || crypto.randomUUID() };
    setBovinos((prev) => {
      const existe = prev.some((b) => b.id === registro.id);
      return existe ? prev.map((b) => (b.id === registro.id ? registro : b)) : [...prev, registro];
    });
    await db.bovinos.put(registro);

    try {
      const { error } = await supabase.from('bovinos').upsert(registro);
      if (error) throw error;
    } catch (e) {
      await db.pendientes.add({ tipo: 'bovino', registro });
    }
    return registro;
  };

  const registrarAplicacion = async (aplicacion) => {
    const registro = { ...aplicacion, id: aplicacion.id || crypto.randomUUID() };
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
  const registrarParto = async ({ madre, fecha, sexoCria, crearCria, codigoCria, nombreCria }) => {
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
        estado: 'activo',
        uso_reproductivo: 'sin_definir',
      });
      criaId = cria.id;
    }

    const registroParto = {
      id: crypto.randomUUID(),
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

  return {
    bovinos,
    aplicaciones,
    partos,
    cargando,
    guardarBovino,
    registrarAplicacion,
    registrarParto,
    recargar: cargar,
  };
}
