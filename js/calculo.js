// Pesos inteiros: média = (2 × N1 + Parcial + Prova N2) / 4.
// Quatro casas nas entradas mantêm comparações exatas em inteiros.
export const CAMPOS = ['n1', 'parcial', 'institucional'];
export const NOMES = { n1: 'N1', parcial: 'Parcial', institucional: 'Prova N2' };
const PESOS = { n1: 2, parcial: 1, institucional: 1 };
const ESCALA = 10000;
const MAXIMO = 10 * ESCALA;

export function lerNota(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return null;
  if (!['string', 'number'].includes(typeof valor)) throw new Error('Informe um número de 0 a 10.');
  const texto = String(valor).trim().replace(',', '.');
  if (!/^(?:\d+(?:\.\d{0,4})?|\.\d{1,4})$/.test(texto)) {
    throw new Error('Use um número de 0 a 10, com até quatro casas decimais.');
  }
  const nota = Number(texto);
  if (nota < 0 || nota > 10) throw new Error('A nota deve estar entre 0 e 10.');
  return nota;
}

const unidades = nota => Math.round(nota * ESCALA);
// Mínimos sugeridos em centésimos, sempre para cima, sem tolerância nos limites.
const minimoEmCentesimos = (deficit, peso) => Math.max(0, Math.ceil(deficit / (peso * 100))) / 100;

function planejar(notas, soma, faltantes, alvo) {
  const deficit = Math.max(0, alvo * 4 * ESCALA - soma);
  const pesoRestante = faltantes.reduce((total, campo) => total + PESOS[campo], 0);
  const possivel = deficit <= pesoRestante * MAXIMO;
  const individuais = faltantes.map(campo => ({
    campo,
    // Só é suficiente com nota 10 em TODAS as demais avaliações faltantes.
    comOutrasDez: minimoEmCentesimos(deficit - (pesoRestante - PESOS[campo]) * MAXIMO, PESOS[campo]),
    comOutrasZero: minimoEmCentesimos(deficit, PESOS[campo]),
  }));
  const iguais = faltantes.length ? minimoEmCentesimos(deficit, pesoRestante) : null;
  const alternativas = [];
  if (possivel && deficit > 0 && faltantes.length === 2) {
    const [primeiro, segundo] = faltantes;
    const menor = individuais[0].comOutrasDez;
    const maior = Math.min(10, individuais[0].comOutrasZero);
    const candidatos = [...new Set([menor, 0, 2, 4, 6, 8, 10, maior])].sort((a, b) => a - b);
    for (const nota of candidatos) {
      if (nota < menor || nota > maior) continue;
      const outra = minimoEmCentesimos(deficit - unidades(nota) * PESOS[primeiro], PESOS[segundo]);
      if (outra > 10) continue;
      const conjunto = { ...notas, [primeiro]: nota, [segundo]: outra };
      const total = CAMPOS.reduce((acc, campo) => acc + unidades(conjunto[campo]) * PESOS[campo], 0);
      alternativas.push({ notas: conjunto, media: total / (4 * ESCALA) });
    }
  }
  return { alvo, deficit: deficit / (4 * ESCALA), possivel, garantido: deficit === 0, iguais, individuais, alternativas };
}

export function simular(entrada = {}) {
  const notas = Object.fromEntries(CAMPOS.map(campo => [campo, lerNota(entrada[campo])]));
  const exame = lerNota(entrada.exame);
  const faltantes = CAMPOS.filter(campo => notas[campo] === null);
  const soma = CAMPOS.reduce((total, campo) => total + (notas[campo] === null ? 0 : unidades(notas[campo]) * PESOS[campo]), 0);
  const pesoRestante = faltantes.reduce((total, campo) => total + PESOS[campo], 0);
  const minima = soma / (4 * ESCALA);
  const maxima = (soma + pesoRestante * MAXIMO) / (4 * ESCALA);
  const completa = faltantes.length === 0;
  const direta = planejar(notas, soma, faltantes, 6);
  const acessoExame = planejar(notas, soma, faltantes, 4);
  let situacao = 'em-aberto';
  if (direta.garantido) situacao = 'aprovacao-garantida';
  else if (!acessoExame.possivel) situacao = 'reprovacao-por-nota';
  else if (!direta.possivel) situacao = completa ? 'exame-final' : 'direta-impossivel';

  const aptoExame = completa && soma >= 4 * 4 * ESCALA && soma < 6 * 4 * ESCALA;
  const exameMinimo = aptoExame ? minimoEmCentesimos(10 * 4 * ESCALA - soma, 4) : null;
  const mediaFinal = aptoExame && exame !== null ? (soma + unidades(exame) * 4) / (8 * ESCALA) : null;
  // A decisão usa a soma inteira original, nunca um valor arredondado para exibição.
  const aprovadoExame = mediaFinal === null ? null : soma + unidades(exame) * 4 >= 5 * 8 * ESCALA;
  const n2 = notas.parcial !== null && notas.institucional !== null
    ? (unidades(notas.parcial) + unidades(notas.institucional)) / (2 * ESCALA) : null;
  return { notas, exame, faltantes, completa, minima, maxima, n2, media: completa ? minima : null,
    direta, acessoExame, situacao, aptoExame, exameMinimo, mediaFinal, aprovadoExame };
}

// Até sete casas: precisão suficiente para todas as médias possíveis das entradas aceitas.
export function formatar(nota) {
  return nota.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 7 });
}
