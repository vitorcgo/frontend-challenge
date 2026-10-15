# Kurio, marketplace de NFTs

Solução do Frontend Challenge: marketplace de NFTs em React e TypeScript, com descoberta, compra e conta do colecionador, em desktop, tablet e mobile, seguindo o [layout do Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1).

API REST, autenticação, carteiras, pagamentos e Socket.IO são simulados com MSW dentro do navegador. Não há backend: o mesmo build roda em desenvolvimento, nos testes e no deploy.

- Aplicação publicada: _a definir após o deploy na Vercel_
- Arquitetura, contratos, cache, tempo real, limitações e desvios do Figma: [ARCHITECTURE.md](ARCHITECTURE.md)

## Stack

React 19, TypeScript 6, Vite 8, TanStack Router, TanStack Query, Axios, Socket.IO (cliente), Tailwind CSS 4, shadcn/ui (Radix), MSW 2 com `@mswjs/socket.io-binding`, Zod (validação de formulários e mocks), Playwright e Lighthouse CI.

## Requisitos

- Node.js 22 ou mais novo
- pnpm 11 (a versão está fixada em `packageManager`; com Corepack, `corepack enable` basta)

## Como rodar

```bash
pnpm install
pnpm dev
```

Abra `http://localhost:5173`. Os mocks iniciam sozinhos; não há serviço externo nem chave de API.

Build de produção e preview local:

```bash
pnpm build
pnpm preview
```

## Variáveis de ambiente

Nenhuma é obrigatória. Os valores padrão estão em `.env.example`.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | Base da API REST (interceptada pelo MSW) |
| `VITE_SOCKET_URL` | origem da página | Origem do Socket.IO (interceptada pelo MSW) |
| `VITE_ENABLE_MOCKS` | `true` | `false` desliga o MSW e as chamadas vão para a API real em `VITE_API_URL`, que não faz parte deste projeto |

## Credenciais fictícias

| Usuário | E-mail | Senha | Carteiras |
| --- | --- | --- | --- |
| Ana Lima | `ana@kurio.dev` | `Kurio2026!` | principal (Ethereum, MetaMask) e secundária (Polygon, Coinbase) |
| Bruno Costa | `bruno@kurio.dev` | `Kurio2026!` | só a principal (Ethereum, WalletConnect) |

Também é possível criar uma conta em `/cadastro`. As senhas ficam no banco simulado com hash PBKDF2, nunca em texto puro.

Cupons: `KURIO10` (10%), `COLECIONADOR5` (5%) e `VERAO2025` (expirado).

## Cenários e reset dos mocks

O cenário é escolhido pela URL e fica salvo no navegador até ser trocado:

```text
http://localhost:5173/?scenario=slow
```

| Cenário | Comportamento |
| --- | --- |
| `default` | Sucesso com latência realista (150 a 450 ms, fixa por URL) |
| `fast` | Sucesso sem latência (usado nos testes) |
| `slow` | Toda resposta leva 2,5 s |
| `variable-latency` | 100 ms a 2 s por URL: buscas seguidas respondem fora de ordem |
| `empty-catalog` | Catálogo sem nenhum NFT |
| `timeout` | Toda chamada leva 30 s, mais que o limite de 15 s do cliente |
| `offline` | Toda chamada falha na rede |
| `server-error` | Toda chamada responde 500 |
| `flaky` | A primeira chamada de cada rota responde 503; a nova tentativa funciona |
| `short-session` | A sessão expira 60 s depois do login |
| `wallet-rejected` | A carteira recusa a conexão no pagamento |
| `payment-rejected` | Todo pedido é recusado pela rede (pagamento recusado) |
| `order-timeout` | O pedido é criado, mas a resposta chega depois do timeout do cliente |

Os dados simulados (usuários, carrinhos, favoritos, carteiras, pedidos e estoque) ficam no `localStorage` e sobrevivem ao refresh. Para voltar ao estado inicial:

```text
http://localhost:5173/?mock-reset
```

O parâmetro restaura os dados e sai da URL sozinho. Para voltar ao cenário padrão, use `?scenario=default`.

### Rotas de controle

Usadas pelos testes e disponíveis no console do navegador (só existem dentro do MSW):

| Rota | Efeito |
| --- | --- |
| `GET` / `PUT /api/__mock/scenario` | Lê ou troca o cenário (`{ "scenario": "slow" }`) |
| `POST /api/__mock/reset` | Restaura os dados; aceita `{ "scenario": "..." }` |
| `POST /api/__mock/sessions/expire` | Expira todas as sessões abertas |
| `PATCH /api/__mock/nfts/:id` | Muda preço ou estoque de um NFT e publica `nft.updated` pelo Socket.IO |
| `POST /api/__mock/realtime/replay` | Reenvia um evento já publicado (`{ "index": -1 }` repete o último, `-2` o anterior) |
| `POST /api/__mock/realtime/disconnect` | Derruba as conexões Socket.IO (o cliente reconecta e reconcilia) |
| `GET /api/__mock/realtime` | Número de conexões ativas |

Exemplos no console:

```js
// troca o cenário sem recarregar a página
await fetch('/api/__mock/scenario', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'server-error' }),
})

// muda o preço de um NFT (com o carrinho ou o detalhe aberto)
await fetch('/api/__mock/nfts/emerald-ape-042', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ price: '1.5' }),
})
```

## Como reproduzir os fluxos de falha

| Fluxo | Como fazer |
| --- | --- |
| Carregamento lento com skeleton | `?scenario=slow`; após 4 s o catálogo avisa da lentidão |
| Erro e nova tentativa | `?scenario=server-error`; quando o erro aparecer, troque o cenário pelo console (`PUT /api/__mock/scenario` com `default`) e clique em "Tentar novamente" |
| Falha passageira com retry automático | `?scenario=flaky` |
| Sem conexão | `?scenario=offline` |
| Respostas fora de ordem | `?scenario=variable-latency` e troque de aba ou digite na busca rapidamente |
| Sessão expirada na navegação | `?scenario=short-session`, entre e espere 60 s; ou chame `POST /api/__mock/sessions/expire` e navegue |
| Sessão expirada no checkout | No pagamento, chame `POST /api/__mock/sessions/expire` e clique em "Confirmar compra": volta ao login e, depois de entrar, ao pagamento com o rascunho |
| Conflito de cadastro | Cadastre-se com `ana@kurio.dev` ou o usuário `ana.lima` |
| Cupom inválido ou expirado | `NAOEXISTE` ou `VERAO2025` no carrinho |
| Favoritar com falha e rollback | Logado, abra um NFT, troque o cenário pelo console para `server-error` e clique em "Favoritar": o coração marca na hora e volta com a mensagem de erro |
| Preço ou estoque mudando no carrinho | Carrinho aberto e `PATCH /api/__mock/nfts/:id` com `price` ou `editions: [{ "id": "1-50", "available": 0 }]` |
| Cotação desatualizada no checkout | Com a revisão aberta, mude o preço por `PATCH`: a revisão avisa e só deixa pagar após "Atualizar revisão" |
| Carteira recusada | `?scenario=wallet-rejected` e "Confirmar compra" |
| Pagamento recusado | `?scenario=payment-rejected` e conclua a compra; os itens continuam no carrinho |
| Timeout com recuperação do pedido | `?scenario=order-timeout`; após 15 s aparece "Tentar de novo", que recupera o mesmo pedido pela chave de idempotência |
| Pedido pendente após refresh | Recarregue a página logo depois de "Confirmar e pagar" |
| Queda do Socket.IO com pedido pendente | Logo depois de pagar, chame `POST /api/__mock/realtime/disconnect` |
| Evento duplicado ou antigo | Mude o preço duas vezes e chame `POST /api/__mock/realtime/replay` com `-1` e `-2`: a tela não volta ao preço antigo |

## Comandos

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Desenvolvimento com mocks |
| `pnpm build` | Verifica os tipos e gera o build de produção |
| `pnpm preview` | Serve o build gerado |
| `pnpm typecheck` | Verificação de tipos |
| `pnpm lint` | ESLint |
| `pnpm test:e2e` | Testes Playwright (gera o build e sobe o preview na porta 4317) |
| `pnpm test:e2e:ui` | Testes no modo interativo do Playwright |
| `pnpm lighthouse:mobile` | Auditoria Lighthouse mobile (3 medições por página) |
| `pnpm lighthouse:desktop` | Auditoria Lighthouse desktop (3 medições por página) |

## Testes

Antes da primeira execução, instale o navegador dos testes:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

- Chromium em dois projetos: desktop (1440 x 900) e mobile (Pixel 7, 390 x 844).
- Cada teste começa num contexto novo de navegador, com o banco simulado zerado.
- Cenários sensíveis a tempo controlam o relógio (`page.clock`), a latência (cenários do MSW) e o disparo dos eventos (rotas de controle).
- Os testes de tempo real passam pelo `socket.io-client` e os de REST pelos handlers do MSW; as verificações olham a interface e o resultado das operações.
- Relatório HTML em `playwright-report/` (`pnpm exec playwright show-report`) e traces das falhas em `test-results/`.
- Regressão visual de Início, detalhe, carrinho e pagamento, com baselines em `e2e/visual.spec.ts-snapshots/`.

Cobertura, nos termos do §9 do enunciado:

| Item | Arquivo |
| --- | --- |
| 1. Busca, filtros, ordenação, paginação e histórico | `catalog.spec.ts` |
| 2. Acesso direto ao detalhe e recurso inexistente | `nft-detail.spec.ts`, `home.spec.ts` |
| 3. Cadastro, login, expiração, logout e troca de usuário | `auth.spec.ts` |
| 4. Favoritos com falha e recuperação | `favorites.spec.ts` |
| 5. Carrinho, quantidades, cupom e persistência | `cart.spec.ts` |
| 6. Compra completa até o recibo | `checkout.spec.ts` |
| 7. Pagamento recusado, clique repetido e timeout | `checkout.spec.ts` |
| 8. Perfil, avatar, senha e carteiras | `account.spec.ts` |
| 9. Preço e estoque pelo Socket.IO durante o checkout | `cart.spec.ts`, `checkout.spec.ts` |
| 10. Eventos duplicados ou antigos, desconexão e pedido pendente | `cart.spec.ts`, `checkout.spec.ts` |
| 11. Teclado, foco de diálogos e validação | `accessibility.spec.ts`, `auth.spec.ts`, `checkout.spec.ts`, `account.spec.ts` |
| 12. Skeletons, falha e nova tentativa | `catalog-states.spec.ts`, `nft-detail.spec.ts`, `home.spec.ts` |

As baselines visuais foram geradas no Windows (sufixo `-win32`). Em outro sistema a renderização de fontes muda; gere as baselines locais com `pnpm exec playwright test e2e/visual.spec.ts --update-snapshots`.

## Lighthouse

Configuração em `lighthouse/` (Lighthouse CI): build otimizado, cenário padrão dos mocks, Início e detalhe do NFT, 3 medições por página e perfil. Relatórios HTML e JSON em `lighthouse/reports/`. A auditoria usa o Chromium do Playwright (instalado com `pnpm exec playwright install chromium`); para usar outro Chrome, defina `CHROME_PATH`.

Medianas (15/10/2026):

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | desktop | 98 | 100 | 100 | 100 | 0,97 s | 12 ms | 0,004 |
| Detalhe | desktop | 98 | 100 | 100 | 100 | 1,00 s | 0 ms | 0 |
| Início | mobile | 77 | 100 | 100 | 100 | 3,91 s | 256 ms | 0,016 |
| Detalhe | mobile | 76 | 100 | 100 | 100 | 4,17 s | 244 ms | 0 |

Performance mobile fica abaixo da meta de 90. A causa e o que foi tentado estão em [ARCHITECTURE.md](ARCHITECTURE.md#performance).

Ambiente da medição: Lighthouse 12.6.1 (`@lhci/cli` 0.15.1), Chromium 156 do Playwright em modo headless, Node 24.19.0, Windows 11, AMD Ryzen 7 4800H, 31 GB de RAM. Mobile com a simulação padrão (RTT 150 ms, 1,6 Mbps, CPU 4x mais lenta); desktop com o preset `desktop`.

## Deploy

O site é estático e roda na Vercel sem configuração extra: `vercel.json` reescreve todas as rotas para o `index.html`, então acesso direto e refresh funcionam em qualquer tela. Os mocks e o Socket.IO simulado vão no build publicado.
