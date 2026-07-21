import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // strictPort: el progreso vive en localStorage, que es POR PUERTO. Sin esto, si
  // 5173 está ocupado Vite salta a 5174/… y el progreso "desaparece" (quedó en el
  // otro puerto). Fijándolo, el origen es siempre el mismo y el progreso persiste.
  //
  // watch.ignored: el `build:audio` escribe cientos de .mp3 en public/audio/. Vite
  // watchea public/ y hace un full-reload por cada archivo → con un build corriendo,
  // la página recarga en loop y "no levanta". Ignorando los .mp3 el dev server queda
  // estable durante la generación (el manifest sí se sigue observando, para refrescar
  // al terminar). Los audios se sirven igual: se piden por URL, no por el watcher.
  server: {
    port: 5173,
    strictPort: true,
    open: true,
    watch: { ignored: ['**/public/audio/**/*.mp3'] },
  },
  // El contenido y el manifest se importan como JSON desde content/ y public/,
  // que están fuera de src/. Sin esto Vite no los deja salir de la raíz.
  resolve: { preserveSymlinks: true },
});
