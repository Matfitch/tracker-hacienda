import Dexie from 'dexie';

export const db = new Dexie('trackerHacienda');

db.version(1).stores({
  produccion: 'fecha',
  pendientes: '++id',
});

db.version(2).stores({
  produccion: 'fecha',
  metas: 'mes',
  pendientes: '++id',
});

db.version(3).stores({
  produccion: 'fecha',
  metas: 'mes',
  bovinos: 'id, codigo',
  aplicaciones: 'id, bovino_id',
  pendientes: '++id',
});

db.version(4).stores({
  produccion: 'fecha',
  metas: 'mes',
  bovinos: 'id, codigo, madre_id',
  aplicaciones: 'id, bovino_id',
  partos: 'id, madre_id',
  pendientes: '++id',
});

db.version(5).stores({
  produccion: 'fecha',
  metas: 'mes',
  bovinos: 'id, codigo, madre_id',
  aplicaciones: 'id, bovino_id',
  partos: 'id, madre_id',
  finanzas: 'id, tipo, fecha',
  finanzasConfig: 'id',
  pendientes: '++id',
});

db.version(6).stores({
  produccion: 'fecha',
  metas: 'mes',
  bovinos: 'id, codigo, madre_id',
  aplicaciones: 'id, bovino_id',
  partos: 'id, madre_id',
  finanzas: 'id, tipo, fecha',
  finanzasConfig: 'id',
  bloques: 'id',
  eventosBloque: 'id, bloque_id',
  pendientes: '++id',
});
