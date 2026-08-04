import ProduccionLeche from './components/ProduccionLeche';
import {useEffect} from 'react';
import { iniciarSincronizacionAutomatica } from './lib/sincronizacion';

function App() {
  useEffect(() => {
    iniciarSincronizacionAutomatica();
  }, []);
  return <ProduccionLeche />;
}

export default App;