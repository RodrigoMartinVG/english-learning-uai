import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
  // El contenido y el manifest se importan como JSON desde content/ y public/,
  // que están fuera de src/. Sin esto Vite no los deja salir de la raíz.
  resolve: { preserveSymlinks: true },
});
