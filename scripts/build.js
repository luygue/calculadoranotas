import { mkdir, copyFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

// O projeto continua estático: publica somente os arquivos usados pelo navegador.
await mkdir('dist/js', { recursive: true });
for (const arquivo of ['index.html', 'js/app.js', 'js/calculo.js']) {
  const texto = await readFile(arquivo, 'utf8');
  if (texto.includes('\uFFFD') || /Ã[¡£©ª³µº]|â€|├/.test(texto)) throw new Error(`Texto com codificação inválida: ${arquivo}`);
  if (arquivo.endsWith('.js')) execFileSync(process.execPath, ['--check', arquivo], { stdio: 'inherit' });
  await copyFile(arquivo, `dist/${arquivo}`);
}
console.log('Build concluído: dist/ (HTML, CSS e JavaScript estáticos).');
