// ============================================================
// Lógica de bloques de forraje: a partir del historial de eventos
// (entrada/salida de pastoreo, fertilización) se calcula todo lo demás.
// ============================================================

function diasEntre(fechaISOInicio, fechaISOFin) {
  const a = new Date(fechaISOInicio + 'T00:00:00');
  const b = new Date(fechaISOFin + 'T00:00:00');
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// Estado actual del bloque: recién sembrado (en establecimiento), en
// pastoreo, en descanso, o sin registros todavía. La siembra "reinicia" el
// estado del bloque aunque haya habido pastoreos antes.
export function estadoActual(bloque, eventos) {
  const bloqueId = bloque.id;
  const movimientos = eventos
    .filter((e) => e.bloque_id === bloqueId && (e.tipo === 'entrada' || e.tipo === 'salida' || e.tipo === 'siembra'))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1)); // más reciente primero

  if (movimientos.length === 0) return { estado: 'sin_registro' };

  const ultimo = movimientos[0];
  const dias = diasEntre(ultimo.fecha, hoyISO());

  if (ultimo.tipo === 'siembra') {
    const diasMin = bloque.dias_min_pastoreo ?? 61;
    const diasMax = bloque.dias_max_pastoreo ?? 75;
    return {
      estado: 'establecimiento',
      desde: ultimo.fecha,
      dias,
      diasMin,
      diasMax,
      listo: dias >= diasMin,
    };
  }
  if (ultimo.tipo === 'entrada') {
    return { estado: 'pastoreo', desde: ultimo.fecha, dias };
  }
  return { estado: 'descanso', desde: ultimo.fecha, dias };
}

// Historial de períodos de pastoreo (empareja entrada→salida), con duración
// en días. El período actual (si sigue en curso) queda con fin: null.
export function historialPastoreos(bloqueId, eventos) {
  const movimientos = eventos
    .filter((e) => e.bloque_id === bloqueId && (e.tipo === 'entrada' || e.tipo === 'salida'))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1)); // cronológico

  const periodos = [];
  let entradaAbierta = null;

  for (const ev of movimientos) {
    if (ev.tipo === 'entrada') {
      entradaAbierta = ev.fecha;
    } else if (ev.tipo === 'salida') {
      const inicio = entradaAbierta || ev.fecha;
      periodos.push({ inicio, fin: ev.fecha, dias: diasEntre(inicio, ev.fecha) });
      entradaAbierta = null;
    }
  }
  if (entradaAbierta) {
    periodos.push({ inicio: entradaAbierta, fin: null, dias: diasEntre(entradaAbierta, hoyISO()) });
  }

  return periodos.sort((a, b) => (a.inicio < b.inicio ? 1 : -1)); // más reciente primero
}

// Historial de fertilizaciones de un bloque, más reciente primero.
export function historialFertilizaciones(bloqueId, eventos) {
  return eventos
    .filter((e) => e.bloque_id === bloqueId && e.tipo === 'fertilizacion')
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export function ultimaFertilizacion(bloqueId, eventos) {
  return historialFertilizaciones(bloqueId, eventos)[0] || null;
}

// Historial de siembras de un bloque, más reciente primero.
export function historialSiembras(bloqueId, eventos) {
  return eventos
    .filter((e) => e.bloque_id === bloqueId && e.tipo === 'siembra')
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}
