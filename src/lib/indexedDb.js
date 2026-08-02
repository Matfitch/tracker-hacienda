import Dexie from 'dexie';

export const db = new Dexie('trackerHacienda');

db.version(1).stores({
  produccion: 'fecha',      // clave: fecha (YYYY-MM-DD)
  pendientes: '++id',       // cola de sincronización cuando no hay internet
});