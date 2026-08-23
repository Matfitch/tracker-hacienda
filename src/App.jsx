import { useEffect, useState } from 'react';
import { Droplet, Syringe, DollarSign, Sprout } from 'lucide-react';
import ProduccionLeche from './components/ProduccionLeche';
import Bovinos from './components/Bovinos';
import Finanzas from './components/Finanzas';
import Bloques from './components/Bloques';
import { iniciarSincronizacionAutomatica } from './lib/sincronizacion';

function App() {
  const [vista, setVista] = useState('produccion'); // 'produccion' | 'bovinos' | 'finanzas' | 'bloques'

  useEffect(() => {
    iniciarSincronizacionAutomatica();
  }, []);

  const botonEstilo = (activo) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.2rem',
    padding: '0.6rem 0',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.65rem',
    fontWeight: 600,
    color: activo ? '#2F4B3C' : '#A39A82',
  });

  return (
    <div>
      {vista === 'produccion' && <ProduccionLeche />}
      {vista === 'bovinos' && <Bovinos />}
      {vista === 'finanzas' && <Finanzas />}
      {vista === 'bloques' && <Bloques />}

      {/* Navegación inferior fija */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          background: '#FFFDF7',
          borderTop: '1px solid #E7DFC9',
          boxShadow: '0 -4px 14px rgba(47,75,60,0.12)',
          zIndex: 50,
        }}
      >
        <button onClick={() => setVista('produccion')} style={botonEstilo(vista === 'produccion')}>
          <Droplet size={18} />
          Producción
        </button>
        <button onClick={() => setVista('bovinos')} style={botonEstilo(vista === 'bovinos')}>
          <Syringe size={18} />
          Bovinos
        </button>
        <button onClick={() => setVista('bloques')} style={botonEstilo(vista === 'bloques')}>
          <Sprout size={18} />
          Pastos
        </button>
        <button onClick={() => setVista('finanzas')} style={botonEstilo(vista === 'finanzas')}>
          <DollarSign size={18} />
          Finanzas
        </button>
      </nav>
      {/* Espacio para que la nav no tape contenido */}
      <div style={{ height: '3.2rem' }} />
    </div>
  );
}

export default App;
