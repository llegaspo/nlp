import { createRoot } from 'react-dom/client';
import App from './App';
import { registerWebTools } from './webmcp';
import './styles.css';

createRoot(document.getElementById('root')!).render(<App />);
registerWebTools();
