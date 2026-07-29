// Metro uzantısız göreli importları ('./core') kendisi çözer, Node ESM çözmez.
// Test betiklerini kaynak koda dokunmadan Node'da çalıştırabilmek için aynı
// çözümlemeyi burada taklit ediyoruz.

import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';

const CANDIDATES = ['.js', '.mjs', '/index.js'];

registerHooks({
  resolve(specifier, context, nextResolve) {
    // Yalnızca kendi kaynağımızda devreye gir; node_modules içindeki CJS
    // çözümlemesine karışırsak paketler bozulur.
    const fromOwnSource =
      context.parentURL?.startsWith('file:') && !context.parentURL.includes('node_modules');

    if (fromOwnSource && specifier.startsWith('.') && !/\.(js|mjs|cjs|json)$/.test(specifier)) {
      const parentPath = context.parentURL ? fileURLToPath(context.parentURL) : process.cwd();
      const base = new URL(specifier, pathToFileURL(parentPath));
      for (const ext of CANDIDATES) {
        const candidate = new URL(base.href + ext);
        if (existsSync(fileURLToPath(candidate))) {
          return nextResolve(candidate.href, context);
        }
      }
    }
    return nextResolve(specifier, context);
  },
});
