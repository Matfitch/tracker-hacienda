import { supabase } from './supabaseClient';
import { db } from './indexedDb';

let sincronizando = false;

// Intenta reenviar todos los registros que quedaron pendientes por falta de red.
// Se puede llamar varias veces seguidas sin problema (evita ejecuciones duplicadas).
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
        } else {
          // Tipo desconocido: lo descartamos para no bloquear la cola indefinidamente
          console.warn('Pendiente con tipo desconocido, se descarta:', item);
        }

        await db.pendientes.delete(item.id);
        enviados++;
      } catch (e) {
        // Se queda en la cola para reintentarlo en el próximo intento de sincronización
        fallidos++;
      }
    }
  } finally {
    sincronizando = false;
  }

  return { enviados, fallidos };
}

// Registra los listeners una sola vez para toda la app:
// - al recuperar conexión
// - al abrir/enfocar la app (por si se perdió el evento "online")
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

  // Intento inicial por si la app se abrió ya con conexión y había pendientes de antes
  if (navigator.onLine) {
    sincronizarPendientes();
  }
}