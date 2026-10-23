import test from 'node:test';
import assert from 'node:assert/strict';
import { simular, lerNota, formatar, CAMPOS } from '../js/calculo.js';

test('N1 = 5 prevê duas notas iguais e todas as alternativas solicitadas', () => {
  const s = simular({ n1: '5,0' });
  assert.equal(s.direta.iguais, 7);
  assert.equal(s.minima, 2.5);
  assert.equal(s.maxima, 7.5);
  for (const [parcial, institucional] of [[4, 10], [6, 8], [8, 6], [10, 4]]) {
    assert.ok(s.direta.alternativas.some(a => a.notas.parcial === parcial && a.notas.institucional === institucional && a.media === 6));
  }
  assert.equal(s.direta.individuais[0].comOutrasDez, 4);
  assert.equal(s.direta.individuais[0].comOutrasZero, 14);
});

test('N1 = 5 e Parcial = 8 exige Prova N2 = 6', () => {
  assert.equal(simular({ n1: 5, parcial: 8 }).direta.iguais, 6);
  assert.equal(simular({ n1: 5, institucional: 8 }).direta.iguais, 6);
  assert.equal(simular({ parcial: 8, institucional: 6 }).direta.iguais, 5);
});

test('campos vazios não são zero; zero explícito é válido', () => {
  assert.equal(lerNota(''), null);
  assert.equal(lerNota('  '), null);
  assert.equal(lerNota(undefined), null);
  assert.equal(lerNota('0'), 0);
  assert.equal(simular({}).maxima, 10);
  assert.equal(simular({ n1: 0 }).maxima, 5);
  assert.deepEqual(simular({ n1: 0 }).faltantes, ['parcial', 'institucional']);
});

test('valida a entrada inteira e aceita separadores decimais', () => {
  for (const valor of ['5,25', '5.25', ' 5,25 ']) assert.equal(lerNota(valor), 5.25);
  for (const valor of ['abc', '5abc', '-1', 11, NaN, Infinity, '1,2,3', '1.2.3', '1e1', '9.99999', {}, true]) {
    assert.throws(() => lerNota(valor));
    assert.throws(() => simular({ parcial: valor }));
    assert.throws(() => simular({ exame: valor }));
  }
});

test('limiares de 4, 6 e 5 após exame não são arredondados', () => {
  assert.equal(simular({ n1: 4, parcial: 4, institucional: '3,9999' }).situacao, 'reprovacao-por-nota');
  assert.equal(simular({ n1: 4, parcial: 4, institucional: 4 }).situacao, 'exame-final');
  const quase = simular({ n1: 6, parcial: 6, institucional: '5,9999' });
  assert.equal(quase.media, 5.999975);
  assert.equal(quase.situacao, 'exame-final');
  assert.equal(formatar(quase.media), '5,999975');
  assert.equal(quase.exameMinimo, 4.01);
  assert.equal(simular({ n1: 6, parcial: 6, institucional: 6 }).situacao, 'aprovacao-garantida');
  assert.equal(simular({ n1: 4, parcial: 4, institucional: 4, exame: '5,9999' }).aprovadoExame, false);
  assert.equal(simular({ n1: 4, parcial: 4, institucional: 4, exame: 6 }).aprovadoExame, true);
});

test('aprovação garantida e impossibilidades matemáticas', () => {
  assert.equal(simular({ n1: 10, parcial: 4 }).situacao, 'aprovacao-garantida');
  assert.equal(simular({ n1: 0 }).situacao, 'direta-impossivel');
  assert.equal(simular({ n1: 0, parcial: 0 }).situacao, 'reprovacao-por-nota');
  assert.equal(simular({ n1: 0 }).acessoExame.iguais, 8);
});

test('exame só calcula quando o semestre está completo e há elegibilidade por nota', () => {
  for (const entrada of [{ n1: 5 }, { n1: 3, parcial: 3, institucional: 3 }, { n1: 6, parcial: 6, institucional: 6 }]) {
    const s = simular({ ...entrada, exame: 10 });
    assert.equal(s.aptoExame, false);
    assert.equal(s.mediaFinal, null);
    assert.equal(s.exameMinimo, null);
  }
  assert.equal(simular({ n1: 5, parcial: 5, institucional: 5 }).exameMinimo, 5);
  assert.equal(simular({ n1: 5, parcial: 5, institucional: 5, exame: 7 }).mediaFinal, 6);
  assert.equal(simular({ n1: 5, parcial: 5, institucional: 5, exame: 0 }).mediaFinal, 2.5);
});

test('todas as 8 combinações de presença e grade inteira de 0 a 10 (1.728 cenários únicos)', () => {
  const possibilidades = [null, ...Array.from({ length: 11 }, (_, i) => i)];
  const pesos = [2, 1, 1];
  const mascaras = new Set();
  let cenarios = 0;
  for (const n1 of possibilidades) for (const parcial of possibilidades) for (const institucional of possibilidades) {
    const valores = [n1, parcial, institucional];
    mascaras.add(valores.map(n => n === null ? 0 : 1).join(''));
    const entrada = { n1, parcial, institucional };
    const s = simular(entrada);
    const soma = valores.reduce((acc, n, i) => acc + (n ?? 0) * pesos[i], 0);
    const pesoFaltante = valores.reduce((acc, n, i) => acc + (n === null ? pesos[i] : 0), 0);
    assert.equal(s.minima, soma / 4);
    assert.equal(s.maxima, (soma + 10 * pesoFaltante) / 4);
    for (const plano of [s.direta, s.acessoExame]) {
      assert.equal(plano.possivel, soma + 10 * pesoFaltante >= plano.alvo * 4);
      assert.equal(plano.garantido, soma >= plano.alvo * 4);
      if (plano.possivel && pesoFaltante > 0) {
        assert.ok(soma * 100 + Math.round(plano.iguais * 100) * pesoFaltante >= plano.alvo * 400);
        if (plano.iguais > 0) assert.ok(soma * 100 + (Math.round(plano.iguais * 100) - 1) * pesoFaltante < plano.alvo * 400);
      }
      for (const alternativa of plano.alternativas) {
        assert.ok(alternativa.media >= plano.alvo);
        CAMPOS.forEach(campo => {
          assert.ok(alternativa.notas[campo] >= 0 && alternativa.notas[campo] <= 10);
          if (entrada[campo] !== null) assert.equal(alternativa.notas[campo], entrada[campo]);
        });
      }
    }
    cenarios++;
  }
  assert.equal(cenarios, 1728);
  assert.equal(mascaras.size, 8);
});

test('frações próximas aos limites em todas as 16 combinações dos quatro campos', () => {
  const valores = [null, 0, 3.9999, 4, 5.9999, 6, 6.0001, 10];
  const mascaras = new Set();
  for (const n1 of valores) for (const parcial of valores) for (const institucional of valores) for (const exame of valores) {
    const s = simular({ n1, parcial, institucional, exame });
    mascaras.add([n1, parcial, institucional, exame].map(n => n === null ? 0 : 1).join(''));
    const soma = 2 * Math.round((n1 ?? 0) * 10000) + Math.round((parcial ?? 0) * 10000) + Math.round((institucional ?? 0) * 10000);
    if (s.completa) {
      assert.equal(s.aptoExame, soma >= 160000 && soma < 240000);
      if (s.aptoExame && exame !== null) assert.equal(s.aprovadoExame, soma + Math.round(exame * 10000) * 4 >= 400000);
    }
    for (const plano of [s.direta, s.acessoExame]) {
      if (plano.possivel && s.faltantes.length) {
        const preenchidas = { ...s.notas };
        s.faltantes.forEach(campo => { preenchidas[campo] = plano.iguais; });
        assert.ok(simular(preenchidas).media >= plano.alvo);
      }
      plano.alternativas.forEach(a => assert.ok(simular(a.notas).media >= plano.alvo));
    }
  }
  assert.equal(mascaras.size, 16);
});
