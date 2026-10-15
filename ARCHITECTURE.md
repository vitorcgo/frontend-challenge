# Arquitetura

Como a solução está organizada, os contratos entre as camadas, as políticas de sessão, cache e tempo real, as decisões de UX, as limitações conhecidas e os desvios em relação ao Figma. Setup, cenários e comandos estão no [README](README.md).

## Visão geral

```text
Componentes React
   │  hooks de feature (useCart, useCheckout, useFavorites...)
   ▼
TanStack Query ──── cache por usuário e por parâmetros
   │  funções de endpoint tipadas
   ▼
Axios (src/api/client.ts) ──── token, carrinho de visitante, normalização de erros
   │  HTTP
   ▼
MSW (service worker) ──── handlers REST + banco simulado no localStorage
   │  publica eventos
   ▼
@mswjs/socket.io-binding ◄──── socket.io-client (src/features/realtime)
```

A interface só conversa com a rede por Axios (REST) e `socket.io-client` (eventos). Componentes e hooks não têm dados fictícios nem caminhos alternativos para os mocks: com `VITE_ENABLE_MOCKS=false` o mesmo código chamaria um backend real nos mesmos contratos.

### Pastas

```text
src/
  api/
    contracts/   tipos de requisição, resposta, erros e eventos (fonte única para app e mocks)
    schemas/     schemas Zod das entradas, conferidos contra os contratos com `satisfies`
    endpoints/   uma função Axios tipada por operação REST
    client.ts    instância Axios e interceptadores
  features/      uma pasta por domínio: catalog, nft-detail, auth, favorites, cart, checkout, account, realtime
  routes/        rotas por arquivo do TanStack Router
  components/    layout (cabeçalho, rodapé, barra mobile) e componentes shadcn/ui adaptados
  mocks/         MSW: handlers, banco simulado, fixtures, cenários, Socket.IO simulado
  lib/           utilitários (ETH em wei, formatação, anúncios para leitores de tela)
e2e/             testes Playwright e baselines visuais
lighthouse/      configuração do Lighthouse CI e relatórios
```

## Roteamento

TanStack Router com rotas por arquivo e divisão automática de código por rota.

| Rota | Tela | Acesso |
| --- | --- | --- |
| `/` | Início com destaque e catálogo | público |
| `/nft/$id` | Detalhe do NFT | público |
| `/carrinho` | Carrinho | público (visitante ou conta) |
| `/entrar`, `/cadastro` | Login e cadastro (diálogo sobre a Início no desktop, tela própria no mobile) | público |
| `/pagamento` | Pagamento | autenticado |
| `/pedido/$id` | Pedido pendente, recusado ou recibo | autenticado |
| `/perfil`, `/carteiras` | Conta do colecionador | autenticado |
| qualquer outra | 404 | público |

- Estado do catálogo na URL (`validateSearch`): busca, coleção, categorias, redes, faixa de preço, aba, ordenação e página. Valores inválidos caem no padrão e valores padrão saem da URL, então refresh e histórico restauram a tela exata.
- Rotas privadas usam `beforeLoad: requireAuth`: sem token, vão para `/entrar?redirect=<rota>`. O `redirect` só aceita caminhos internos.
- Se a sessão acabar com a tela aberta (expiração ou 401), a própria tela leva ao login com o `redirect`, e o pagamento preserva o rascunho do formulário.

## Contratos REST

Base `/api`. Corpo e resposta em JSON. Valores em ETH sempre como string decimal (`"1.19"`); somas, descontos e taxas são calculados em wei com `BigInt` (`src/lib/eth.ts`).

### Erros

Todo erro segue o mesmo envelope:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Revise os campos destacados.", "fieldErrors": { "email": ["..."] }, "details": {} } }
```

| Status | Códigos |
| --- | --- |
| 401 | `UNAUTHENTICATED`, `SESSION_EXPIRED`, `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN` (recurso de outro usuário), `WALLET_REJECTED` |
| 404 | `NOT_FOUND` |
| 409 | `EMAIL_TAKEN`, `USERNAME_TAKEN`, `CONFLICT`, `AVAILABILITY_CONFLICT`, `QUOTE_STALE`, `QUOTE_EXPIRED`, `IDEMPOTENCY_CONFLICT`, `WALLET_NOT_CONNECTED` |
| 422 | `VALIDATION_ERROR`, `COUPON_INVALID`, `COUPON_EXPIRED` |
| 500, 503 | `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE` (falha transitória) |

No cliente, `src/api/errors.ts` converte tudo em `ApiError` (status, código, mensagem, erros por campo), incluindo `NETWORK_ERROR` e `TIMEOUT`, que não vêm da API. Os formulários levam `fieldErrors` para o campo correspondente.

### Recursos

| Recurso | Operações |
| --- | --- |
| Sessão | `POST /auth/register`, `POST /auth/login`, `GET /auth/session`, `POST /auth/logout` |
| NFTs | `GET /nfts` (`search`, `category`, `network`, `priceMin`, `priceMax`, `collection`, `tab`, `sort`, `page`, `pageSize`; resposta paginada com contagens por filtro e faixa de preço), `GET /nfts/featured`, `GET /nfts/:id` |
| Favoritos | `GET /favorites`, `PUT /favorites/:nftId`, `DELETE /favorites/:nftId` |
| Carrinho | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`, `PUT /cart/coupon`, `DELETE /cart/coupon`, `POST /cart/merge` |
| Cotação | `POST /checkout/quote` (`{ walletId, network }`): itens, cupom, desconto, taxa e total válidos por 5 minutos |
| Pedidos | `POST /orders` (`{ quoteId }` e cabeçalho `Idempotency-Key`), `GET /orders/:id` |
| Perfil | `GET /profile`, `PUT /profile`, `PUT /profile/avatar` (data URL até 200 KB), `DELETE /profile/avatar`, `PUT /profile/password` |
| Carteiras | `GET /wallets`, `POST /wallets`, `PUT /wallets/:id`, `POST /wallets/:id/connection`, `DELETE /wallets/:id/connection` |

Corpos das requisições que alteram dados:

| Operação | Corpo |
| --- | --- |
| `POST /auth/register` | `{ username, email, password }` |
| `POST /auth/login` | `{ email, password }` |
| `POST /cart/items` | `{ nftId, editionId, quantity }` |
| `PATCH /cart/items/:id` | `{ quantity }` |
| `PUT /cart/coupon` | `{ code }` |
| `POST /cart/merge` | `{ guestCartId }` |
| `POST /checkout/quote` | `{ walletId, network }` |
| `POST /orders` | `{ quoteId }` e cabeçalho `Idempotency-Key` |
| `PUT /profile` | `{ displayName, username, email, ensName, walletNickname }` |
| `PUT /profile/avatar` | `{ dataUrl }` (PNG, JPEG ou WebP, até 200 KB) |
| `PUT /profile/password` | `{ currentPassword, newPassword }` |
| `POST /wallets` | dados da carteira e `slot` (`primary` ou `secondary`) |
| `PUT /wallets/:id` | `{ displayName, alias, network, profileName, address, secondaryAddress, walletType, referralCode, email, ensName }` |
| `POST /wallets/:id/connection` | `{ network }` |

Os tipos estão em `src/api/contracts/` e as validações de entrada em `src/api/schemas/`; os handlers do MSW usam os mesmos arquivos, então app e mocks não divergem.

Exemplos de respostas relevantes:

- Carrinho: `{ items: [{ id, nftId, nftVersion, editionId, quantity, maxQuantity, unitPrice, addedPrice, lineTotal, issue }], itemCount, coupon, summary: { subtotal, discount, networkFee, total } }`. `issue` é `sold-out` ou `insufficient`; itens com problema ficam fora do total.
- Pedido: `{ id, status: 'pending' | 'confirmed' | 'rejected', version, items, coupon, summary, wallet, transactionHash, explorerUrl, rejectionReason }`. Itens e valores são uma cópia da cotação: mudanças posteriores no catálogo não alteram o recibo.
- `409 QUOTE_STALE` traz em `details.changes` o que mudou (preço, estoque, cupom, taxa ou conteúdo do carrinho).

## Eventos Socket.IO

| Evento | Direção | Conteúdo |
| --- | --- | --- |
| `session.join` | cliente → servidor | token da sessão, para associar a conexão ao usuário |
| `nft.updated` | servidor → todos | preço, preço anterior, disponibilidade e edições |
| `order.updated` | servidor → só o dono | status, hash da transação e motivo da recusa |

Todo evento tem a mesma forma:

```ts
{ id: string, type: 'nft.updated', resource: { type: 'nft', id: string }, version: number, occurredAt: string, data: {...} }
```

- `id` é estável: o mesmo evento repetido chega com o mesmo id.
- `version` cresce a cada mudança do recurso. O cliente ignora evento já visto e evento com versão menor ou igual à que já conhece (no detalhe, nas listas, no destaque ou no carrinho), então um evento atrasado nunca volta a tela a um estado anterior.
- `nft.updated` atualiza o NFT direto no cache (detalhe, listas e destaque). Se o NFT está no carrinho, o carrinho é relido da API, que recalcula preço, estoque e resumo, e a mudança é anunciada para leitores de tela.
- `order.updated` atualiza o pedido e anuncia a confirmação ou a recusa.

## Política de sessão

- Login e cadastro devolvem um token opaco com validade de 2 horas (60 s no cenário `short-session`). Ele fica no `localStorage` e vai no cabeçalho `Authorization: Bearer`.
- A sessão é recuperada no refresh por `GET /auth/session`. Abas abertas acompanham login e logout pelo evento `storage`.
- Expiração: o cliente agenda o fim da sessão para o `expiresAt` e também trata qualquer 401 de uma requisição que levou token. Em ambos os casos o token sai, os dados privados saem do cache e aparece o aviso "Sua sessão expirou" com "Entrar". Telas privadas levam ao login com retorno para a mesma tela.
- Logout e troca de usuário: todas as consultas privadas (carrinho, favoritos, perfil, carteiras, pedidos) são removidas do cache, e o socket da sessão anterior é fechado com seus listeners. As chaves de cache incluem o id do usuário, então nada de um usuário é reaproveitado por outro.
- Trocar a senha encerra as outras sessões do usuário e mantém a atual.

## Estado do carrinho

- O carrinho mora na API, nunca só no navegador. O visitante tem um id gerado no navegador (`localStorage`), enviado no cabeçalho `X-Guest-Cart`; quem está logado usa o token.
- Ao entrar na conta, `POST /cart/merge` une os itens do visitante ao carrinho do usuário, respeitando o estoque, e o id de visitante é descartado.
- Quantidade, remoção e cupom são mutations em fila (`scope`), para cliques seguidos chegarem na ordem. Cada resposta traz o carrinho inteiro recalculado, que substitui o cache.
- Mudanças de preço ou estoque vindas do Socket.IO marcam o item ("Preço atualizado", "Esgotado", "Acima do estoque") e bloqueiam "Conectar e finalizar" enquanto houver item com problema.
- Após um pedido confirmado, a API remove do carrinho só os itens e as quantidades comprados. Pedido recusado mantém tudo.

## Checkout e idempotência

1. "Confirmar compra" valida o formulário, salva a carteira (criando ou atualizando), conecta na rede escolhida e pede uma cotação.
2. A revisão mostra a cotação. Se o preço ou o estoque mudar pelo socket com a revisão aberta, ela marca o que mudou e só deixa pagar depois de "Atualizar revisão".
3. "Confirmar e pagar" envia `POST /orders` com uma chave de idempotência por cotação, guardada no `sessionStorage`. A API confere de novo preço, estoque, cupom, taxa e conteúdo do carrinho; qualquer diferença vira `409 QUOTE_STALE` e exige nova revisão.
4. Clique repetido ou reenvio após timeout usam a mesma chave e recebem o mesmo pedido. A mesma chave com outra cotação responde `409 IDEMPOTENCY_CONFLICT`.
5. O pedido nasce pendente e é resolvido pela simulação em 2 s. O resultado chega por `order.updated`; se o socket estiver fora, a tela consulta `GET /orders/:id` a cada 5 s enquanto o pedido estiver pendente, e a leitura também resolve pedidos vencidos depois de um refresh. Confirmado e recusado são terminais.
6. O recibo só aparece para pedido confirmado pela simulação.

## Estratégia de cache

| Dado | Chave | Política |
| --- | --- | --- |
| Lista de NFTs | `['nfts', 'list', parâmetros normalizados]` | 30 s; a página anterior fica visível e esmaecida durante a troca |
| Detalhe, destaque | `['nfts', 'detail', id]`, `['nfts', 'featured']` | 30 s; o detalhe é pré-carregado no loader da rota |
| Sessão | `['session', token]` | sem expirar; relida ao reconectar |
| Carrinho | `['cart', userId ou guest:id]` | substituído pela resposta de cada mutation |
| Favoritos | `['favorites', userId]` | atualização otimista com rollback |
| Perfil, carteiras | `['profile', userId]`, `['wallets', userId]` | atualizados pela resposta das mutations |
| Pedido | `['orders', id]` | consulta a cada 5 s só enquanto pendente |

- Consultas canceladas pelo `signal` do TanStack Query abortam o Axios; respostas de uma busca antiga nunca sobrescrevem a atual.
- Retry: até 2 novas tentativas, com espera exponencial, só para falhas transitórias (rede, timeout, 5xx). Erros 4xx não se repetem. Mutations nunca repetem sozinhas; o pedido depende da chave de idempotência para a nova tentativa.
- Sem refetch ao focar a janela; a sincronização vem dos eventos e da reconciliação.
- Atualização otimista com rollback em favoritos: o coração marca na hora; se a API falhar, volta ao estado anterior e mostra o erro. As mutations ficam em fila e só a última invalida a lista, então cliques seguidos terminam no estado do último clique.

## Reconciliação entre REST e Socket.IO

- A API é a fonte da verdade; o socket só acelera a atualização.
- Os eventos aplicam mudanças pequenas no cache (preço e estoque) ou invalidam o recurso para relê-lo da API (carrinho e pedido), sempre conferindo a versão.
- Ao reconectar, eventos podem ter sido perdidos: catálogo, carrinho e pedidos são invalidados e relidos da API.
- Cada sessão tem o próprio socket (`forceNew`). No login ele envia `session.join`; no logout ou troca de usuário ele é fechado, então eventos de uma sessão anterior não chegam à seguinte. `order.updated` só é enviado às conexões do dono do pedido.

## Mocks

- Handlers REST em `src/mocks/handlers/`, um por recurso, com o banco simulado em `src/mocks/db.ts`, salvo no `localStorage` com versão de esquema. Ao mudar o formato, a versão sobe e o banco antigo é descartado.
- Fixtures: 36 NFTs em 3 redes, 4 edições por NFT, 2 usuários com carteiras e 3 cupons. A primeira página do catálogo reproduz o Figma.
- Toda alteração (compra, alteração pela rota de controle) sai pela resposta REST e pelo evento Socket.IO correspondente.
- Latência determinística: cada URL tem sempre o mesmo atraso no cenário escolhido, o que torna reproduzíveis as respostas fora de ordem.
- Os mocks iniciam depois do primeiro quadro da tela; as chamadas à API esperam por eles (`src/lib/api-ready.ts`).

### Transporte do Socket.IO e limitações

- `socket.io-client` real, interceptado pelo `@mswjs/socket.io-binding`. Só WebSocket: o MSW não intercepta o long-polling HTTP do Engine.IO, por isso o cliente usa `transports: ['websocket']`.
- O binding não envia o ping do Engine.IO; o mock envia a cada 20 s para o cliente não derrubar a conexão.
- O binding não tem salas nem namespaces. O mock mantém um mapa de conexões por usuário para enviar `order.updated` só ao dono.
- Cada aba tem o próprio servidor simulado: os eventos só chegam à aba que gerou a mudança.
- O MSW exige o service worker, que impede o cache de voltar e avançar do navegador (aviso do Lighthouse). O pacote `tough-cookie` do MSW foi trocado por um substituto mínimo no build (`src/mocks/shims/`), porque o app não usa cookies; nos mocks os cookies guardam só nome e valor.

## Acessibilidade

- Navegação por teclado em todas as telas, com link "Pular para o conteúdo" e contorno de foco na cor de destaque (o Figma não define foco).
- Diálogos e gavetas (Radix) prendem o foco e o devolvem a quem abriu, inclusive quando o botão de origem ficou desativado durante a ação.
- Campos com rótulo, erros ligados por `aria-describedby` e foco no primeiro campo inválido. No login e no cadastro o Figma usa só placeholder; o rótulo existe para leitores de tela e o placeholder continua visível.
- Mutations e eventos em tempo real são anunciados por uma região `aria-live` (preço alterado, item esgotado, pedido confirmado ou recusado, sessão expirada).
- Estados que no Figma dependem só da cor ganharam outro sinal: ponto sob o item ativo da barra mobile, edição esgotada riscada, link "Aplique aqui" sublinhado, `aria-current` na página atual.
- Skeletons com shimmer que param com `prefers-reduced-motion`.
- Sem rolagem horizontal de 320 a 1440 px (equivale a zoom de 400%); para isso as abas do catálogo quebram de linha em telas estreitas.
- Verificado com axe-core (WCAG 2.1 A/AA) em todas as telas e estados, nas larguras 1440, 1280, 1024, 768, 390 e 320: nenhuma violação.

## Performance

Os números estão no [README](README.md#lighthouse). No site publicado, o PageSpeed Insights deu 91, 90 e 88 no mobile (mediana 90) e 100 no desktop.

O que pesa no mobile: o app é uma SPA que precisa baixar e executar o React e iniciar o MSW antes de pintar. Com a CPU simulada 4x mais lenta, a avaliação de scripts soma cerca de 1,5 s (app cerca de 770 ms, MSW cerca de 700 ms). A rede não é o gargalo: a cadeia crítica é curta (HTML, CSS, fonte e JavaScript principal de 85 KB comprimido).

O que foi feito:

- Zod fora do carregamento inicial (tipos separados dos schemas; a validação da URL do catálogo não usa Zod).
- Diálogo de busca, gaveta de filtros, ordenação e barra lateral carregados sob demanda, com pré-carga ao passar o mouse.
- `tough-cookie` substituído no bundle dos mocks (de 194 para 74 KB comprimido).
- Socket.IO em chunk separado, carregado depois dos mocks.
- Mocks iniciando depois do primeiro quadro.
- Imagens em WebP responsivo (480 e 960) e fonte hospedada no projeto, só o subconjunto latino.
- Skeleton do detalhe com a altura do conteúdo: o CLS do desktop caiu de 0,211 para 0.

O que foi testado e revertido: um esqueleto estático no `index.html` reduziu o primeiro conteúdo de 3,1 para 2,1 s, mas deslocou o trabalho de JavaScript para a janela medida como bloqueio e a nota caiu para cerca de 60.

O enunciado pede a auditoria com mocks e funcionalidades completos, sem simplificações para pontuar, então o MSW continua no carregamento auditado.

## Assets

- Ícones (Iconly) exportados dos vetores do Figma e otimizados com SVGO; os de uma cor usam `currentColor` e são aplicados como máscara CSS, herdando a cor do texto.
- As 4 fotos de NFT do arquivo convertidas para WebP em 480 e 960 px (de cerca de 8 MB para 320 KB). As miniaturas da galeria repetem a imagem principal, como no Figma.
- Fonte Roboto Mono variável hospedada no projeto (`@fontsource-variable`).
- Criados por falta no Figma: favicon "K" na cor de destaque e coração preenchido para o estado "favoritado".
- Botões redondos com ícone (quantidade, voltar) são feitos em CSS com o ícone do Figma, em vez de exportar cada botão como imagem.

## Decisões de UX

- Elementos do Figma fora do escopo do desafio ficam visíveis, mas sem aparentar funcionar: "Criadores" e "Aprenda" no cabeçalho, links do rodapé e redes sociais, newsletter (avisa que não está disponível), login com Google e Facebook, "Esqueceu a senha?", escanear e lista de interesse na barra mobile, "Ler mais" do Diário da Cunhagem, Atividade, Ofertas, Arquivos baixados e Suporte no menu do perfil. Os pontos do carrossel do banner são decorativos (há um slide) e os cartões de carteira do mobile não têm o menu de três pontos, cujas ações o Figma não define.
- "Explorar" das promoções abre o catálogo já filtrado (Novos lançamentos; Arte digital), destino que o Figma não define.
- O catálogo inteiro vive na URL, para refresh, histórico e links compartilhados restaurarem a mesma tela.
- O login abre como diálogo sobre a Início no desktop e como tela própria no mobile, e sempre volta para onde a pessoa estava.
- Itens adicionados como visitante não se perdem ao entrar na conta.
- O pagamento tem uma etapa de revisão antes de enviar o pedido, porque a cotação é a referência do preço cobrado e mudanças precisam de nova confirmação.
- O recibo é uma página (`/pedido/:id`), não um modal, para sobreviver ao refresh e poder ser reaberto.
- Mensagens de erro dizem o que aconteceu e o que fazer, e as falhas de compra afirmam quando nada foi cobrado.

## Limitações

- Tudo é simulado no navegador: dados, eventos e pagamentos existem só no navegador de quem usa, sem compartilhamento entre dispositivos.
- Cada aba tem uma cópia do banco em memória, salva no `localStorage` a cada mudança e atualizada nas outras abas pelo evento `storage` (login, carrinho e pedidos feitos numa aba valem nas outras). Duas gravações no mesmo instante em abas diferentes ainda podem se sobrescrever, e os eventos em tempo real não passam de uma aba para a outra.
- Não há listagem de pedidos anteriores; o enunciado pede consulta de estado e recibo, acessados pelo link do pedido.
- A aba "Avaliações" mostra nota e total, sem comentários, porque a API não tem comentários.
- Baselines visuais geradas no Windows; em outro sistema precisam ser geradas de novo.
- Versões travadas por compatibilidade: MSW 2 (o `@mswjs/socket.io-binding` ainda não aceita o MSW 3) e TypeScript 6.0 (o `typescript-eslint` ainda não suporta o 7). O lockfile fixa o restante.

## Desvios do Figma

O Figma define a identidade visual; o enunciado define o comportamento. Onde o Figma tem desenho, a implementação o segue. Esta seção registra o que ficou diferente e por quê, separado do que o Figma simplesmente não desenhou.

### Mudanças visuais

| Onde | O que mudou | Motivo |
| --- | --- | --- |
| Cabeçalho | Linha inferior de 0,3 px desenhada com 1 px e 30% de opacidade | Abaixo de 1 px o navegador não desenha a linha |
| Barra mobile | Curva central com largura fixa e laterais esticáveis | O desenho é de 414 px; assim funciona em 390 e 320 px sem distorcer |
| Barra mobile | Mantida no login, cadastro, carrinho e pagamento | Os frames dessas telas não têm a barra; sem ela não há como navegar para fora |
| Cards | Preço anterior riscado | No Figma ele só muda de cor; riscado deixa claro que é o preço antigo sem depender da cor |
| Cards mobile | Sem o coração de favorito | No Figma ele aparece só no primeiro card, sem comportamento definido; favoritar fica no detalhe |
| Filtros | Trilho do preço fora da faixa escolhida 30% mais claro; texto "Preço: 0.05 a 4.20 ETH" com os limites do catálogo | No Figma o trilho é todo laranja e não mostra a faixa; os limites do Figma não correspondem aos dados |
| Detalhe | "Mais desta coleção" sem os pontos de carrossel, rolando na horizontal quando não cabe | Com 5 itens todos cabem no desktop; pontos sem função pareceriam controles |
| Detalhe mobile | Barra de compra mostra o total (preço x quantidade) | O Figma mostra só o preço unitário |
| Login e cadastro | Botão de mostrar senha com o mesmo ícone nos dois estados, laranja quando a senha está visível | O Figma só tem o ícone de olho riscado |
| Login e cadastro mobile | Margem lateral de 24 px (Figma: 28) | Em 390 px o título "Criar perfil de colecionador" quebraria em duas linhas |
| Carrinho | Linha do item mostra a edição; valores do resumo com "ETH" ("(-) 0.00 ETH") | Sem a edição, o mesmo NFT em duas edições ficaria igual; o Figma mostra "(-) 00.00" sem unidade |
| Pagamento mobile | Título em 18 px abaixo de 400 px | Em 390 px "Pagamento com carteira" quebraria em duas linhas |
| Confirmação | Recibo como página (`/pedido/:id`) em vez de cartão sobre fundo vazio; o X volta ao início | O recibo precisa sobreviver ao refresh e poder ser reaberto |
| Confirmação | Data no formato "15 de out. de 2026" | Formato brasileiro, como o resto da interface (Figma: "29 Jul, 2026") |

### Correções de inconsistências do Figma

| Onde | No Figma | Na implementação |
| --- | --- | --- |
| Detalhe | Textos de "Contrato" e "Direitos autorais" trocados entre si | Cada rótulo com o seu texto |
| Ordenação | Seta sobreposta ao texto do seletor | Seta ao lado do texto |
| Pagamento e perfil | "Nome ENS" é só um seletor ".eth", sem campo para digitar o nome | Campo de texto com o sufixo ".eth" |
| Pagamento | A primeira opção de "Carteira e rede" é a imagem do selo de carteiras compatíveis | Três opções de texto: MetaMask, WalletConnect e Coinbase Wallet |
| Carrinho mobile | Ícone de remover sobreposto ao "+" de um único item | Botão de remover no canto de cada card |

### Estados e telas que o Figma não desenhou

O enunciado pede que estados não desenhados sigam o padrão visual do projeto e que perfil, carteiras e confirmação funcionem em mobile mesmo sem frame. Foram criados com as cores, a tipografia e os componentes do Figma:

- **Estados de dados em todas as telas:** skeleton com shimmer, aviso de lentidão, atualização em segundo plano, erro com "Tentar novamente", vazio, recurso inexistente e página 404.
- **Conta e sessão:** cabeçalho logado (nome com link para o perfil e "Sair"), aviso de sessão expirada, erros nos campos e no topo dos formulários.
- **Catálogo:** selo "Esgotado", ordenações além de "Listados recentemente", "Limpar filtros", diálogo de busca pela lupa, aviso "Resultados para..." e busca enquanto digita no mobile.
- **Detalhe:** estoque e limite por compra, edição esgotada, estado favoritado e erro ao favoritar, conteúdo da aba "Avaliações".
- **Carrinho:** avisos de preço atualizado, esgotado e acima do estoque; cupom aplicado com "Remover".
- **Pagamento e confirmação:** revisão do pedido antes de pagar, pedido pendente e recusado, linha de desconto no recibo.
- **Perfil e carteiras:** troca e remoção do avatar, carteira principal ainda não cadastrada, "Igual à carteira principal".
- **Larguras sem frame:** tablet de 768 a 1279 px (cabeçalho e rodapé compactos, banner menor, filtros em gaveta, galeria acima das informações); mobile de confirmação, perfil, carteiras e do formulário de pagamento; seções que o frame mobile omite (promoções, Diário da Cunhagem, abas do detalhe, paginação). O "NFT em destaque" aparece a partir de 1280 px, onde existe a barra lateral.

Os ajustes de acessibilidade em relação ao layout estão na seção [Acessibilidade](#acessibilidade), e os elementos do Figma que ficam fora do escopo, em [Decisões de UX](#decisões-de-ux).
