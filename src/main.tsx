
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Set favicon dynamically 
const link = document.querySelector("link[rel~='icon']");
if (!link) {
  const newLink = document.createElement('link');
  newLink.rel = 'icon';
  newLink.href = '/logo.svg';
  document.head.appendChild(newLink);
}

createRoot(document.getElementById("root")!).render(<App />);
