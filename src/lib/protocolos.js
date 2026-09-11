// ============================================================
// Lógica de protocolos sanitarios del hacienda.
// La CATEGORÍA (que tú eliges al registrar/reclasificar el animal)
// decide qué protocolos aplican — no solo la edad.
// ============================================================

const DIA_MS = 24 * 60 * 60 * 1000;

export function diasEntre(fechaISOInicio, fechaISOFin = hoyISO()) {
  const a = new Date(fechaISOInicio + 'T00:00:00');
  const b = new Date(fechaISOFin + 'T00:00:00');
  return Math.round((b - a) / DIA_MS);
}

export function sumarDias(fechaISO, dias) {
  const d = new Date(fechaISO + 'T00:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- Categorías ----------
// grupo: agrupa la categoría para filtros y para saber qué protocolos aplican
//   'cria'      -> calendario fijo 0-150 días
//   'joven'     -> trimestral (y puede gestar, si es hembra)
//   'adulto'    -> trimestral + reproducción completa (si es hembra)
export const CATEGORIAS = [
  { value: 'ternera', label: 'Ternera', sexo: 'hembra', grupo: 'cria' },
  { value: 'ternero', label: 'Ternero', sexo: 'macho', grupo: 'cria' },
  { value: 'vacona', label: 'Vacona', sexo: 'hembra', grupo: 'joven' },
  { value: 'torete', label: 'Torete', sexo: 'macho', grupo: 'joven' },
  { value: 'vaca', label: 'Vaca', sexo: 'hembra', grupo: 'adulto' },
  { value: 'toro', label: 'Toro', sexo: 'macho', grupo: 'adulto' },
];

export function infoCategoria(categoria) {
  return CATEGORIAS.find((c) => c.value === categoria) || CATEGORIAS[0];
}

// ¿Esta categoría puede tener control de gestación (inseminación/parto)?
function puedeGestar(categoria) {
  const info = infoCategoria(categoria);
  return info.sexo === 'hembra' && (info.grupo === 'joven' || info.grupo === 'adulto');
}

// ---------- Calendario fijo para terneros/as: 0 a 150 días ----------
export const PROTOCOLO_TERNERO = [
  { etapa: 'nacimiento', dia: 0, etiqueta: 'Nacimiento', sugerido: 'Baycox 5% 3ml/10kg + Vigantol ADE 2ml vía oral' },
  { etapa: 'dia30', dia: 30, etiqueta: 'Día 30', sugerido: 'Catosal B12 5ml' },
  { etapa: 'dia60', dia: 60, etiqueta: 'Día 60', sugerido: 'Catosal B12 5ml' },
  { etapa: 'dia90', dia: 90, etiqueta: 'Día 90', sugerido: 'Catosal B12 5ml' },
  { etapa: 'dia120', dia: 120, etiqueta: 'Destete (día 120)', sugerido: 'Yatren 10-40ml + Catosal B12 10ml' },
  { etapa: 'dia150', dia: 150, etiqueta: 'Día 150', sugerido: 'Catosal B12 10ml' },
];

const EDAD_INICIO_TRIMESTRAL_DIAS = 180; // 6 meses
const FRECUENCIA_TRIMESTRAL_DIAS = 90;
const DIA_TRATAMIENTO_POSTPARTO = 3;
const DIA_SECADO_GESTACION = 210; // 7 meses aprox
const DIA_PARTO_ESPERADO = 285;

// Devuelve la inseminación activa de un animal: la más reciente que todavía
// no se marcó como "repite_celo" ni "aborto" (esas ya no cuentan como
// gestación en curso), y que ya se realizó (no una programada a futuro).
export function inseminacionActiva(bovinoId, inseminaciones) {
  return inseminaciones
    .filter((i) => i.bovino_id === bovinoId && i.resultado !== 'repite_celo' && i.resultado !== 'aborto' && i.resultado !== 'programada')
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0] || null;
}

// Próxima inseminación programada (a futuro) que todavía no se marcó como
// realizada.
export function inseminacionProgramada(bovinoId, inseminaciones) {
  return inseminaciones
    .filter((i) => i.bovino_id === bovinoId && i.resultado === 'programada')
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))[0] || null;
}

export function historialInseminaciones(bovinoId, inseminaciones) {
  return inseminaciones.filter((i) => i.bovino_id === bovinoId).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

// Devuelve todos los eventos pendientes de un animal, según su categoría.
export function calcularEventos(bovino, aplicaciones, inseminaciones = []) {
  // Animal vendido o fallecido: ya no necesita protocolos pendientes.
  if (bovino.estado && bovino.estado !== 'activo') return [];

  const eventos = [];
  const apps = aplicaciones.filter((a) => a.bovino_id === bovino.id);
  const info = infoCategoria(bovino.categoria);
  const inseminacion = inseminacionActiva(bovino.id, inseminaciones);

  const yaAplicado = (etapa, desdeFecha = null) =>
    apps.some((a) => a.etapa === etapa && (!desdeFecha || a.fecha >= desdeFecha));

  // --- Calendario fijo 0-150 días: SOLO categoría ternera/ternero ---
  if (info.grupo === 'cria' && bovino.fecha_nacimiento) {
    PROTOCOLO_TERNERO.forEach((paso) => {
      const fecha = sumarDias(bovino.fecha_nacimiento, paso.dia);
      eventos.push({
        tipo: 'ternero',
        etapa: paso.etapa,
        etiqueta: paso.etiqueta,
        sugerido: paso.sugerido,
        fecha,
        completado: yaAplicado(paso.etapa),
      });
    });
  }

  // --- Trimestral: categorías joven y adulto (vacona/torete/vaca/toro) ---
  // Si se conoce la fecha de nacimiento, arranca a los 6 meses de vida.
  // Si NO se conoce (frecuente en animales adultos comprados/heredados),
  // se usa la fecha en que se registró en la app como punto de partida,
  // asumiendo que ya está en edad de recibirlo (no se espera otros 6 meses).
  if ((info.grupo === 'joven' || info.grupo === 'adulto') && (bovino.fecha_nacimiento || bovino.fecha_ingreso)) {
    const ultimaTrimestral = apps
      .filter((a) => a.etapa === 'trimestral')
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];

    let proximaTrimestral;
    if (ultimaTrimestral) {
      proximaTrimestral = sumarDias(ultimaTrimestral.fecha, FRECUENCIA_TRIMESTRAL_DIAS);
    } else if (bovino.fecha_nacimiento) {
      proximaTrimestral = sumarDias(bovino.fecha_nacimiento, EDAD_INICIO_TRIMESTRAL_DIAS);
    } else {
      proximaTrimestral = bovino.fecha_ingreso; // fecha de nacimiento desconocida: due desde que se registró
    }

    eventos.push({
      tipo: 'trimestral',
      etapa: 'trimestral',
      etiqueta: 'Vitaminización + desparasitación',
      sugerido: null,
      fecha: proximaTrimestral,
      completado: false,
    });
  }

  // --- Post-parto: día 3 después de la última cría (vacona o vaca) ---
  if (puedeGestar(bovino.categoria) && bovino.fecha_ultimo_parto) {
    const fecha = sumarDias(bovino.fecha_ultimo_parto, DIA_TRATAMIENTO_POSTPARTO);
    eventos.push({
      tipo: 'postparto',
      etapa: 'postparto',
      etiqueta: 'Tratamiento post-parto (día 3)',
      sugerido: null,
      fecha,
      completado: yaAplicado('postparto', bovino.fecha_ultimo_parto),
    });
  }

  // --- Inseminación programada a futuro (vacona o vaca) ---
  const programada = inseminacionProgramada(bovino.id, inseminaciones);
  if (puedeGestar(bovino.categoria) && programada) {
    eventos.push({
      tipo: 'inseminacion_programada',
      etapa: 'inseminacion_programada',
      etiqueta: 'Inseminación programada',
      sugerido: programada.pajuela_codigo || programada.pajuela_nombre
        ? `Pajuela: ${programada.pajuela_codigo || ''} ${programada.pajuela_nombre || ''}`.trim()
        : null,
      fecha: programada.fecha,
      completado: false,
      inseminacionId: programada.id,
    });
  }

  // --- Gestación: secado (mes 7) y parto esperado (vacona o vaca) ---
  if (puedeGestar(bovino.categoria) && inseminacion) {
    const fechaSecado = sumarDias(inseminacion.fecha, DIA_SECADO_GESTACION);
    const fechaPartoEsperado = sumarDias(inseminacion.fecha, DIA_PARTO_ESPERADO);
    eventos.push({
      tipo: 'secado',
      etapa: 'secado',
      etiqueta: 'Secar y separar (mes 7 de gestación)',
      sugerido: null,
      fecha: fechaSecado,
      completado: yaAplicado('secado', inseminacion.fecha),
    });
    eventos.push({
      tipo: 'parto_esperado',
      etapa: 'parto_esperado',
      etiqueta: 'Parto esperado',
      sugerido: null,
      fecha: fechaPartoEsperado,
      completado: false,
      informativo: true,
    });
  }

  const hoy = hoyISO();
  return eventos
    .filter((e) => !e.completado)
    .map((e) => ({
      ...e,
      estado: e.fecha < hoy ? 'vencido' : e.fecha === hoy ? 'hoy' : 'proximo',
    }))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
}

export function proximoEvento(bovino, aplicaciones, inseminaciones = []) {
  const eventos = calcularEventos(bovino, aplicaciones, inseminaciones);
  return eventos[0] || null;
}

// Tiempo de gestación transcurrido, en meses y días completos.
export function tiempoGestacion(fechaInseminacion, fechaFin = hoyISO()) {
  const dias = diasEntre(fechaInseminacion, fechaFin);
  const meses = Math.floor(dias / 30);
  const diasRestantes = dias - meses * 30;
  return { diasTotales: dias, meses, dias: diasRestantes };
}
