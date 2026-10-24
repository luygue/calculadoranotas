import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('prevê com apenas N1 em tempo real, apresenta alternativas e mantém Calcular', async ({ page }) => {
  await page.getByLabel('Nota N1', { exact: true }).fill('5,0');
  const resultado = page.getByRole('status');
  await expect(resultado).toContainText('7,0 na Parcial e 7,0 na Prova N2');
  await resultado.getByText('Ver outras combinações', { exact: true }).first().click();
  const tabela = resultado.getByRole('table').first();
  for (const notas of [['4,0', '10,0'], ['6,0', '8,0'], ['8,0', '6,0'], ['10,0', '4,0']]) {
    await expect(tabela.getByRole('row').filter({ hasText: new RegExp(`^${notas.join('')}6,0$`) })).toHaveCount(1);
  }
  await page.getByRole('button', { name: 'Calcular', exact: true }).click();
  await expect(resultado).toContainText('Média mínima possível2,5');
  await expect(resultado).toContainText('Média máxima possível7,5');
  await page.getByLabel('Parcial N2', { exact: true }).fill('8');
  await expect(resultado).toContainText('Pelo menos 6,0 na Prova N2');
  await expect(page.locator('#institucional')).toHaveValue('');
});

test('qualquer ordem de preenchimento e exame final', async ({ page }) => {
  await page.locator('#institucional').fill('8');
  await expect(page.getByRole('status')).toContainText('na N1');
  await page.locator('#parcial').fill('8');
  await expect(page.getByRole('status')).toContainText('Pelo menos 4,0 na N1');
  await page.locator('#n1').fill('2');
  await expect(page.getByRole('status')).toContainText('Exame final por nota');
  await expect(page.getByRole('status')).toContainText('pelo menos 5,0 no exame');
  await page.locator('#exame').fill('4.9999');
  await expect(page.getByRole('status')).toContainText('Média insuficiente após exame');
  await expect(page.getByRole('status')).toContainText('4,99995');
  await page.locator('#exame').fill('5');
  await expect(page.getByRole('status')).toContainText('Aprovação por nota após exame');
});

test('validação não converte erros ou vazio em zero', async ({ page }) => {
  for (const valor of ['11', '-1', 'abc', '5abc', '1,2,3', '5.99999']) {
    await page.locator('#n1').fill(valor);
    await expect(page.locator('#n1')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('status')).toContainText('Confira as notas');
  }
  await page.locator('#n1').fill('0');
  await expect(page.getByRole('status')).toContainText('Aprovação direta impossível');
  await page.locator('#n1').fill('');
  await expect(page.getByRole('status')).toContainText('Preencha qualquer nota');
});

test('persistência, tema e limpeza sem apagar outras preferências', async ({ page }) => {
  await page.locator('#n1').fill('5,25');
  await page.locator('#parcial').fill('0');
  await page.getByRole('button', { name: 'Modo noturno' }).click();
  await page.reload();
  await expect(page.locator('#n1')).toHaveValue('5,25');
  await expect(page.locator('#parcial')).toHaveValue('0');
  await expect(page.locator('#institucional')).toHaveValue('');
  await expect(page.locator('body')).toHaveClass('dark');
  await page.getByRole('button', { name: 'Limpar notas' }).click();
  await expect(page.locator('#n1')).toBeFocused();
  await page.reload();
  for (const id of ['n1', 'parcial', 'institucional', 'exame']) await expect(page.locator(`#${id}`)).toHaveValue('');
  await expect(page.locator('body')).toHaveClass('dark');
});

test('armazenamento indisponível e registro corrompido não impedem cálculos', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('notas-fametro', '{inválido'));
  await page.reload();
  await expect(page.getByRole('status')).toContainText('Preencha qualquer nota');
  await page.evaluate(() => {
    Object.defineProperty(Storage.prototype, 'setItem', { value() { throw new Error('indisponível'); } });
  });
  await page.locator('#n1').fill('5');
  await expect(page.getByRole('status')).toContainText('7,0 na Parcial e 7,0 na Prova N2');
  await expect(page.locator('#armazenamento')).toContainText('Não foi possível salvar');
  await page.getByRole('button', { name: 'Modo noturno' }).click();
  await expect(page.locator('body')).toHaveClass('dark');
});

test('layout sem transbordamento e temas', async ({ page }, testInfo) => {
  const erros = [];
  page.on('pageerror', erro => erros.push(erro.message));
  await page.locator('#n1').fill('5');
  await expect(page.locator('[onclick]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `artifacts/${testInfo.project.name}-claro.png`, fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Modo noturno' }).click();
  await expect(page.locator('.container')).toHaveCSS('background-color', 'rgb(15, 23, 42)');
  await page.screenshot({ path: `artifacts/${testInfo.project.name}-escuro.png`, fullPage: true, animations: 'disabled' });
  expect(erros).toEqual([]);
});
