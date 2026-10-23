import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const raiz = resolve(process.argv[2] || '.');
const porta = Number(process.env.PORT || 4173);
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
createServer(async (req, res) => {
  try {
    const caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const arquivo = resolve(raiz, `.${caminho === '/' ? '/index.html' : caminho}`);
    if (!arquivo.startsWith(raiz + sep)) { res.writeHead(403).end(); return; }
    const conteudo = await readFile(arquivo);
    res.writeHead(200, { 'Content-Type': tipos[extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(conteudo);
  } catch { res.writeHead(404).end('Arquivo não encontrado.'); }
}).listen(porta, '127.0.0.1', () => console.log(`Calculadora: http://127.0.0.1:${porta}`));
