import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Set initial lang attribute from localStorage or default
const savedLang = localStorage.getItem('i18nextLng') || 'en';
document.documentElement.lang = savedLang;

createRoot(document.getElementById("root")!).render(<App />);
