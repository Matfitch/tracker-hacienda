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