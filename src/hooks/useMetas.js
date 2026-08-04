import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { db } from '../lib/indexedDb';

export function useMetas() {
  const [metas, setMetas] = useState({});

  useEffect(() => {
    supabase
      .from('metas_mensuales')
      .select('*')
      .then(async ({ data, error }) => {
        if (error) throw error;
        if (data) {
          const mapa = {};
          data.forEach((m) => { mapa[m.mes] = m.litros; });
          setMetas(mapa);
          await db.metas.bulkPut(data);
        }
      })
      .catch(async () => {
        const local = await db.metas.toArray();
        const mapa = {};
        local.forEach((m) => { mapa[m.mes] = m.litros; });
        setMetas(mapa);
      });
  }, []);

  const guardarMeta = async (mes, litros) => {
    setMetas((prev) => ({ ...prev, [mes]: litros }));
    await db.metas.put({ mes, litros });

    try {
      const { error } = await supabase.from('metas_mensuales').upsert({ mes, litros });
      if (error) throw error;
    } catch (e) {
      await db.pendientes.add({ tipo: 'meta', mes, litros });
    }
  };

  return { metas, guardarMeta };
}