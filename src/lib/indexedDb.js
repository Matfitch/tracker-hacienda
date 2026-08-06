import Dexie from 'dexie';

export const db = new Dexie('trackerHacienda');

// v1: estructura original
db.version(1).stores({
  produccion: 'fecha',
  pendientes: '++id',
});

// v2: se agrega tabla de metas para respaldo offline (Dexie migra sola, sin perder datos)
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