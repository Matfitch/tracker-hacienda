import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useMetas() {
  const [metas, setMetas] = useState({});

  useEffect(() => {
    supabase.from('metas_mensuales').select('*').then(({ data }) => {
      if (data) {
        const mapa = {};
        data.forEach((m) => { mapa[m.mes] = m.litros; });
        setMetas(mapa);
      }
    });
  }, []);

  const guardarMeta = async (mes, litros) => {
    setMetas((prev) => ({ ...prev, [mes]: litros }));
    await supabase.from('metas_mensuales').upsert({ mes, litros });
  };

  return { metas, guardarMeta };
}