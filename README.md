# Calculadora de Notas da CEUNI Fametro Manaus

Site existente em HTML, CSS e JavaScript puro, sem framework. Preserva os temas claro/escuro, o botão Calcular e a publicação estática pelo GitHub Pages.

## Simulação

- `N2 composta = (Parcial + Prova N2) / 2`.
- `Média semestral = (N1 + N2 composta) / 2`.
- Média de pelo menos 6: aprovação direta por nota.
- Média de 4 a menos de 6: exame final por nota. Abaixo de 4: reprovação por nota.
- `Média após exame = (Média semestral + Exame) / 2`, exigindo pelo menos 5.

Qualquer nota pode ser preenchida primeiro. O cálculo é automático. Campos vazios representam avaliações desconhecidas; zero informado é válido. Com N1 = 5, sugere Parcial = 7 e Prova N2 = 7 e apresenta alternativas, incluindo 4/10, 6/8, 8/6 e 10/4. Com N1 = 5 e Parcial = 8, exige Prova N2 de pelo menos 6.

Os pesos são N1 = 1/2, Parcial = 1/4 e Prova N2 = 1/4. O intervalo possível considera zero e dez nas avaliações desconhecidas. Com várias notas faltantes, a sugestão de notas iguais é uma combinação suficiente; os mínimos condicionais individuais pressupõem dez em todas as outras avaliações desconhecidas e não devem ser usados juntos. Com só uma nota faltante, o mínimo é calculado mantendo todas as notas já informadas.

Entradas aceitam ponto ou vírgula, de 0 a 10, com até quatro casas decimais. Os cálculos de decisão usam inteiros em escala 10.000, sem arredondar médias para decidir a situação. Sugestões em centésimos são arredondadas para cima. Médias exibem todas as casas necessárias, inclusive valores como 5,999975. O exame só entra no cálculo com o semestre completo e média de 4 a menos de 6.

As notas são salvas apenas no `localStorage` deste navegador, na chave `notas-fametro`. Limpar notas remove somente essa chave e mantém a preferência de tema existente (`tema-calculadora`). Falhas de armazenamento não impedem cálculos.

## Fonte e validade

Pesquisa realizada em 23/10/2026. Referência implementada: [Calendário Discente 2025, sistema avaliativo para cursos exceto Medicina](https://fametro.edu.br/wp-content/uploads/2025/01/Calendario-Discente-2025.pdf). O documento anuncia o modelo a partir de 2025/1. O texto indexado da fonte oficial confirma composição das avaliações e limites de aprovação/exame; o acesso direto ao PDF foi bloqueado pelo firewall da instituição durante a pesquisa.

Não foi localizada confirmação oficial de que esse modelo permanece vigente para Direito presencial de Manaus em 2026/2. A fonte e o período ficam documentados aqui; o bloco explicativo da página foi removido a pedido do responsável pelo site. A simulação não representa resultado acadêmico oficial. Não se aplicaram regulamentos de Medicina, EAD, outras unidades ou outras instituições.

A frequência mínima aplicável a esse curso e período não foi confirmada. Não há decisão de aprovação por frequência: os resultados são exclusivamente por nota e o site orienta a conferir a situação com a coordenação. Regras específicas de estágio, TCC, práticas ou disciplinas devem ser conferidas no plano aplicável.

## Desenvolvimento e validação

Requer Node.js 22 ou superior:

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run serve -- dist
```

Abra `http://127.0.0.1:4173`. O build copia somente `index.html`, `js/app.js` e `js/calculo.js` para `dist/`, valida a sintaxe JavaScript e verifica problemas de codificação. Não há dependências de produção. Os testes cobrem as oito combinações de presença das notas semestrais, as dezesseis incluindo o exame, limites e previsões; testes no navegador cobrem desktop e celular, persistência, erros e temas. O workflow de validação executa testes e build em pushes e PRs.

O GitHub Pages pode continuar publicando a raiz da branch configurada, pois todos os arquivos estáticos permanecem nela. O ZIP histórico do repositório foi preservado; não é utilizado pelo site nem pelo build.
