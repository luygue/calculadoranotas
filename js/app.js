import { CAMPOS, NOMES, lerNota, simular, formatar as fmt } from './calculo.js';

const IDS = [...CAMPOS, 'exame'];
const CHAVE = 'notas-fametro';
const resultado = document.getElementById('resultado');
const armazenamento = document.getElementById('armazenamento');

function carregar(chave) {
  try { return localStorage.getItem(chave); } catch { return null; }
}

function salvar(chave, valor) {
  try { localStorage.setItem(chave, valor); return true; } catch { return false; }
}

function valores() {
  return Object.fromEntries(IDS.map(id => [id, document.getElementById(id).value]));
}

function aplicarTema(escuro) {
  document.body.classList.toggle('dark', escuro);
  const botao = document.getElementById('themeButton');
  botao.textContent = escuro ? '☀️ Modo claro' : '🌙 Modo noturno';
  botao.setAttribute('aria-pressed', String(escuro));
}

function planoHTML(plano, faltantes, direta) {
  const titulo = direta ? 'Para aprovação direta' : 'Para alcançar o mínimo de acesso ao exame';
  if (plano.garantido) return `<section class="plano"><h3>${titulo}</h3><p>O mínimo de média ${fmt(plano.alvo)} já está garantido por nota.</p></section>`;
  if (!plano.possivel) return `<section class="plano"><h3>${titulo}</h3><p>Matematicamente impossível com as notas informadas, mesmo com 10,0 em todas as avaliações restantes.</p></section>`;
  const texto = faltantes.length === 1
    ? `Você precisa tirar pelo menos <strong>${fmt(plano.iguais)}</strong> na <strong>${NOMES[faltantes[0]]}</strong>, mantendo as outras notas informadas.`
    : `Para ${direta ? 'aprovação direta' : 'alcançar o mínimo de acesso ao exame'} com média ${fmt(plano.alvo)}, você precisa tirar ${faltantes.map(campo => `<strong>${fmt(plano.iguais)}</strong> na <strong>${NOMES[campo]}</strong>`).join(' e ')}, considerando notas iguais nas avaliações restantes.`;
  let html = `<section class="plano"><h3>${titulo}</h3><p>${texto}</p>`;
  if (faltantes.length > 1) {
    html += '<p class="nota-info">Essa é uma combinação suficiente. As notas podem ser diferentes, respeitando os pesos de cada avaliação.</p>';
    if (plano.alternativas.length) {
      html += `<div class="tabela"><table><caption>Outras combinações para média de pelo menos ${fmt(plano.alvo)}</caption><thead><tr>${faltantes.map(campo => `<th scope="col">${NOMES[campo]}</th>`).join('')}<th scope="col">Média</th></tr></thead><tbody>`;
      html += plano.alternativas.map(opcao => `<tr>${faltantes.map(campo => `<td>${fmt(opcao.notas[campo])}</td>`).join('')}<td>${fmt(opcao.media)}</td></tr>`).join('');
      html += '</tbody></table></div>';
    }
    html += '<details><summary>Mínimos condicionais por avaliação</summary><p>Estes valores só bastam se você tirar 10,0 em TODAS as outras avaliações ainda em branco. Não são mínimos independentes e não devem ser usados juntos.</p><ul>';
    html += plano.individuais.map(item => `<li>${NOMES[item.campo]}: <strong>${fmt(item.comOutrasDez)}</strong>, se as demais notas faltantes forem 10,0.</li>`).join('');
    html += '</ul></details>';
  }
  return `${html}</section>`;
}

function mostrar(simulacao) {
  const s = simulacao;
  const estados = {
    'em-aberto': ['neutro-box', 'Planeje suas próximas notas', 'A aprovação direta ainda é possível.'],
    'aprovacao-garantida': ['aprovado-box', 'Aprovação direta garantida por nota', 'A média mínima já alcança 6,0, mesmo com zero nas avaliações restantes.'],
    'reprovacao-por-nota': ['reprovado-box', 'Média insuficiente por nota', 'Não é possível alcançar média 4,0 com as notas informadas.'],
    'direta-impossivel': ['exame-box', 'Aprovação direta impossível', 'Ainda é possível alcançar o mínimo para acesso ao exame final.'],
    'exame-final': ['exame-box', 'Exame final por nota', 'A média semestral está entre 4,0 e menos de 6,0.'],
  };
  let [classe, titulo, mensagem] = estados[s.situacao];
  if (s.completa && s.direta.garantido) mensagem = 'A média semestral alcançou o mínimo de 6,0 para aprovação direta por nota.';
  if (s.mediaFinal !== null) {
    classe = s.aprovadoExame ? 'aprovado-box' : 'reprovado-box';
    titulo = s.aprovadoExame ? 'Aprovação por nota após exame' : 'Média insuficiente após exame';
    mensagem = s.aprovadoExame ? 'A média após o exame alcançou o mínimo de 5,0.' : 'A média após o exame ficou abaixo de 5,0.';
  }
  resultado.className = `resultado ${classe}`;
  let html = `<h2>${titulo}</h2><p class="status ${classe}">${mensagem}</p>`;
  if (s.faltantes.length) html += planoHTML(s.direta, s.faltantes, true);
  html += `<div class="resumo"><div><span>Média mínima possível</span><strong>${fmt(s.minima)}</strong></div><div><span>Média máxima possível</span><strong>${fmt(s.maxima)}</strong></div></div>`;
  if (s.n2 !== null) html += `<p>N2 composta: (${fmt(s.notas.parcial)} + ${fmt(s.notas.institucional)}) ÷ 2 = <strong>${fmt(s.n2)}</strong>.</p>`;
  if (s.completa) html += `<p>Média semestral: (${fmt(s.notas.n1)} + ${fmt(s.n2)}) ÷ 2 = <strong>${fmt(s.media)}</strong>.</p>`;
  html += `<p>Faltam <strong>${fmt(s.direta.deficit)}</strong> pontos na média semestral para aprovação direta e <strong>${fmt(s.acessoExame.deficit)}</strong> para alcançar o mínimo de 4,0.</p>`;
  if (s.faltantes.length) {
    html += '<p class="nota-info">O intervalo considera de 0 a 10 em cada campo em branco. Campos vazios continuam sem nota definida.</p>';
    html += `<details><summary>Planejar acesso ao exame final</summary>${planoHTML(s.acessoExame, s.faltantes, false)}</details>`;
    html += '<p class="nota-info">Para realizar o exame, a média semestral precisa ficar abaixo de 6,0. Com 6,0 ou mais, há aprovação direta por nota.</p>';
  }
  if (s.aptoExame) {
    html += `<section class="plano"><h3>Exame final</h3><p>Você precisa de pelo menos <strong>${fmt(s.exameMinimo)}</strong> no exame para alcançar média final 5,0.</p>`;
    if (s.mediaFinal !== null) html += `<p>Média após o exame: (${fmt(s.media)} + ${fmt(s.exame)}) ÷ 2 = <strong>${fmt(s.mediaFinal)}</strong>.</p>`;
    else html += '<p>Preencha a nota do exame para simular a média final.</p>';
    html += '</section>';
  } else if (s.exame !== null) {
    html += '<p class="nota-info">A nota de exame foi preservada. Ela só entra no cálculo quando todas as notas semestrais estiverem preenchidas e a média for de 4,0 a menos de 6,0.</p>';
  }
  html += '<p class="nota-info">Sugestões mínimas em centésimos são arredondadas para cima. A classificação usa a média sem arredondamento. A frequência e a situação acadêmica oficial devem ser conferidas com a instituição.</p>';
  resultado.innerHTML = html;
}

function calcular(persistir = true) {
  const entrada = valores();
  if (persistir) {
    armazenamento.textContent = salvar(CHAVE, JSON.stringify(entrada))
      ? 'Notas salvas somente neste navegador.'
      : 'Não foi possível salvar neste navegador. Os cálculos continuam funcionando.';
  }
  let invalido = false;
  for (const id of IDS) {
    const campo = document.getElementById(id);
    const erro = document.getElementById(`${id}-erro`);
    try {
      lerNota(entrada[id]);
      campo.removeAttribute('aria-invalid');
      erro.textContent = '';
    } catch (e) {
      invalido = true;
      campo.setAttribute('aria-invalid', 'true');
      erro.textContent = e.message;
    }
  }
  if (invalido) {
    resultado.className = 'resultado reprovado-box';
    resultado.innerHTML = '<h2>Confira as notas</h2><p>Corrija os campos indicados para atualizar a simulação. Nenhuma entrada inválida foi considerada zero.</p>';
    return;
  }
  if (CAMPOS.every(id => entrada[id].trim() === '') && entrada.exame.trim() === '') {
    resultado.className = 'resultado neutro-box';
    resultado.innerHTML = '<h2>Quanto falta para passar?</h2><p>Preencha qualquer nota para ver suas possibilidades. Só a N1 já é suficiente para prever quanto tirar na Parcial e na Prova N2.</p>';
    return;
  }
  mostrar(simular(entrada));
}

function limpar() {
  for (const id of IDS) document.getElementById(id).value = '';
  try { localStorage.removeItem(CHAVE); armazenamento.textContent = 'Notas apagadas deste navegador.'; }
  catch { armazenamento.textContent = 'Campos limpos. O armazenamento do navegador está indisponível.'; }
  calcular(false);
  document.getElementById('n1').focus();
}

try {
  const salvo = JSON.parse(carregar(CHAVE));
  if (salvo && typeof salvo === 'object') {
    for (const id of IDS) {
      if (typeof salvo[id] === 'string' && salvo[id].length <= 32) document.getElementById(id).value = salvo[id];
    }
  }
} catch { /* Um registro inválido não impede o uso da calculadora. */ }

aplicarTema(carregar('tema-calculadora') === 'escuro');
document.getElementById('themeButton').addEventListener('click', () => {
  const escuro = !document.body.classList.contains('dark');
  aplicarTema(escuro);
  salvar('tema-calculadora', escuro ? 'escuro' : 'claro');
});
IDS.forEach(id => document.getElementById(id).addEventListener('input', () => calcular()));
document.getElementById('calcular').addEventListener('click', () => calcular());
document.getElementById('limpar').addEventListener('click', limpar);
calcular(false);
