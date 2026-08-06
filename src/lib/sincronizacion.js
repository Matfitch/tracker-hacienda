import { supabase } from './supabaseClient';
import { db } from './indexedDb';

let sincronizando = false;
const EVENTO_SYNC = 'hacienda:datos-actualizados';

export async function sincronizarPendientes() {
  if (sincronizando) return { enviados: 0, fallidos: 0 };
  if (!navigator.onLine) return { enviados: 0, fallidos: 0 };

  sincronizando = true;
  let enviados = 0;
  let fallidos = 0;

  try {
    const pendientes = await db.pendientes.toArray();

    for (const item of pendientes) {
      try {
        if (item.tipo === 'produccion') {
          const { error } = await supabase
            .from('produccion_leche')
            .upsert(
              { fecha: item.fecha, manana: item.manana, tarde: item.tarde },
              { onConflict: 'fecha' }
            );
          if (error) throw error;
        } else if (item.tipo === 'meta') {
          const { error } = await supabase
            .from('metas_mensuales')
            .upsert({ mes: item.mes, litros: item.litros });
          if (error) throw error;
        } else if (item.tipo === 'bovino') {
          const { error } = await supabase.from('bovinos').upsert(item.registro);
          if (error) throw error;
        } else if (item.tipo === 'aplicacion') {
          const { error } = await supabase.from('aplicaciones_protocolo').upsert(item.registro);
          if (error) throw error;
        } else if (item.tipo === 'parto') {
          const { error } = await supabase.from('partos').upsert(item.registro);
          if (error) throw error;
        } else {
          console.warn('Pendiente con tipo desconocido, se descarta:', item);
        }

        await db.pendientes.delete(item.id);
        enviados++;
      } catch (e) {
        fallidos++;
      }
    }
  } finally {
    sincronizando = false;
  }

  window.dispatchEvent(new CustomEvent(EVENTO_SYNC, { detail: { enviados, fallidos } }));
  return { enviados, fallidos };
}

export function alRecuperarDatos(callback) {
  const handler = () => callback();
  window.addEventListener(EVENTO_SYNC, handler);
  window.addEventListener('online', handler);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) callback();
  });
  return () => {
    window.removeEventListener(EVENTO_SYNC, handler);
    window.removeEventListener('online', handler);
  };
}

let inicializado = false;
export function iniciarSincronizacionAutomatica() {
  if (inicializado) return;
  inicializado = true;

  window.addEventListener('online', () => {
    sincronizarPendientes();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      sincronizarPendientes();
    }
  });

  if (navigator.onLine) {
    sincronizarPendientes();
  }
}