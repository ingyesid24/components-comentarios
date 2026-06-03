import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/comment-section.ts'),
      name: 'CommentSection',
      formats: ['es', 'umd'],
      fileName: (format) => `comment-section.${format}.js`,
    },
  },
  publicDir: false,
  server: {
    open: true,
  },
});
