# Planejamento frontend: blog público, landing page e administração privada

Data: 2026-09-28. Status: planejamento; este documento não implementa telas, configurações, dependências ou mudanças no backend.

## 1. Resultado esperado

Visitantes entram em uma landing page editorial marcante, descobrem artigos, pesquisam e leem sem conta. O proprietário entra por um endereço administrativo conhecido apenas por ele na navegação normal, autentica-se e gerencia publicações. Não haverá cadastro, comentários autenticados nem chamadas públicas para login.

O catálogo do Design System deixa de ser a homepage. Seus componentes continuam compondo o site; a aplicação de demonstração fica disponível apenas em desenvolvimento. Discrição de navegação, controle de acesso e exclusão do catálogo do build são requisitos diferentes, detalhados abaixo.

Preservar a identidade existente: papel quente, tinta escura, terracota, Newsreader/Manrope/Geist Mono, livros, cadernos, texturas leves e temas claro/escuro. A landing page pode ter ilustrações de tela inteira e movimento expressivo; a leitura dos artigos e a administração mantêm comportamento estável.

## 2. Base realmente inspecionada

Frontend: SolidJS + TypeScript + Vite. `src/App.tsx` abre o catálogo, usa hash routes e textos de demonstração. Há alterações locais preexistentes; preservá-las na futura implementação. Não partir de um template novo nem trocar por React.

Componentes encontrados: `Book`, `PostCard`, `PostGrid`, `ArticlePage`, `NotebookArt`, `Button`, `Field`, `Toggle`, `Badge`, `Pagination`, `Alert`, `EmptyState`, `Skeleton`, `Accordion`, `Presence`, `Dialog`, `Toast`, `Author`, `Quote` e `Icon`. Animação de abertura de livro já existe em `transitionBookToArticle`.

Backend: há autenticação por cookies JWT/refresh, CSRF, usuários, sessões, CRUD editorial e busca FTS. O código atual difere em pontos do [plano original do backend](../../my-blog-api/docs/auth-users-posts-plan.md). Integração deve seguir as rotas/DTOs implementadas; recursos ausentes são dependências explícitas, não contratos presumidos.

Esta inspeção é estática do checkout local, não uma certificação de produção nem execução da suíte de testes. Antes de implementar, congelar/revalidar os contratos com o backend da mesma versão.

### 2.1 Matriz do contrato atual

Todas as rotas abaixo usam prefixo `/api/v1`.

| Área | Observado no código | Consequência para o frontend |
| --- | --- | --- |
| Listagem pública | `GET /posts?limit=&offset=` → `items,total,limit,offset` | Paginação numérica/offset, não cursor |
| Busca | `GET /posts/search?q=&limit=&offset=` | Caminho separado; consulta vazia usa listagem normal |
| Artigo | `GET /posts/{slug}` | URL por slug, sem segmento de locale no contrato |
| Tags | `GET /tags` → coleção com contagem | Mostrar temas reais; não inferir suporte a filtro |
| Conteúdo | `summary`, `content_md`, `content_html`, `featured_image_media_id` | Adaptador explícito para componentes existentes |
| Datas | Inteiros Unix em segundos | Converter com `* 1000` antes de `Date`/Intl |
| Admin | `/admin/posts`, `/{id}`, `/{id}/publish`, `/{id}/unpublish`, `/preview` | Fluxos de criação, edição, publicação e preview utilizáveis |
| Escrita concorrente | `ETag` e `If-Match`, conflito 412 | Guardar header original; não assumir só campo `version` |
| Tags na escrita | `tags: string[]` de nomes | Não enviar IDs; a API normaliza/cria tags junto ao post |
| Estados | `draft`, `published`, `scheduled`, `archived` | Exibir estados reais; não prometer execução de agendamento |
| Exclusão | `DELETE` físico com versão | Confirmação de exclusão definitiva, sem desfazer fictício |
| Login | Resposta `{ user, csrf_token }` + cookies HttpOnly | Sem JWT acessível ao JavaScript |
| Renovação | `/auth/csrf`, `/auth/refresh`, logout e sessões | Bootstrap privado e coordenação entre abas |
| Usuário próprio | `GET/PATCH /users/me`, `PUT /users/me/password` | Perfil/senha/sessões privados |
| Papéis | `owner` e `author`; escrita permite autor autenticado | Requisito atual owner-only demanda alinhamento na API |
| Cache público | Posts 60 s; tags 300 s | Despublicação não implica desaparecimento imediato de caches |

Fontes locais: [rotas públicas](../../my-blog-api/src/posts/routes.rs), [rotas editoriais](../../my-blog-api/src/posts/admin_routes.rs), [DTOs](../../my-blog-api/src/posts/dto.rs), [handlers](../../my-blog-api/src/posts/admin_handler.rs), [auth](../../my-blog-api/src/auth/routes.rs) e [Design System](../src/design-system/README.md).

### 2.2 Dependências e diferenças que precisam ficar visíveis no planejamento

| Recurso pretendido | Situação observada | Decisão de entrega |
| --- | --- | --- |
| Upload/entrega de mídia | Há campo/configuração de mídia, mas não localizei rotas/storage completos | Dependência obrigatória para concluir publicação com capa; placeholder visual só para a etapa de integração |
| Filtro por tag, autor, intervalo/idioma | DTO público só recebe paginação; busca só recebe `q`/paginação | Planejar extensão contratual; não filtrar apenas a página carregada e chamar isso de filtro global |
| Capa acessível | DTO não contém URL resolvida nem alt/dimensões | Solicitar contrato de mídia/alt; não converter ID em URL inventada |
| Autor público/tempo de leitura | DTO contém `author_id`, não perfil público nem reading time | Bio pública aprovada em conteúdo do site inicialmente; tempo derivado só no detalhe ou campo adicional |
| Traduções dos posts | Não há locale no schema/DTO atual | PT/EN de interface já; conteúdo não é traduzido nem agrupado artificialmente |
| Lixeira/restore | Não há rota restore nem exclusão lógica | Usar arquivamento como ação reversível distinta; DELETE permanece definitivo |
| Agendamento | Há campos/estado; não localizei worker/publicação automática | Não disponibilizar agendar como operação concluída até haver execução e testes |
| Import/export | Não localizei endpoints dedicados | Viável no cliente via File API/download, utilizando CRUD existente e limites reais |
| CRUD global de tags | Não localizei rotas privadas de tags | Criar/remover associação no editor; gestão global fica dependente de API |
| `null` em campos opcionais | Update usa fallback para capa/agendamento existentes | Remoção desses valores depende de semântica PATCH corrigida; não informar sucesso sem efeito |
| Rate limit de login | Não identifiquei limitador de tentativas nas rotas inspecionadas | Gate de segurança em API/proxy antes de expor login; botão disabled não substitui limite no servidor |

Essas dependências não serão implementadas neste documento. Separar marcos: integração que já funciona com a API atual e conclusão da experiência editorial completa, que exige contratos adicionais.

## 3. Público, administrador e áreas discretas

### 3.1 Política de acesso

O site público não solicita sessão ao carregar a home/lista/artigo. Não renderiza botão de entrar, cadastrar, escrever, painel ou design no header, footer, busca, menu mobile ou página sobre. Não existe atalho secreto clicando no logotipo nem credencial embutida no frontend.

Nome de trabalho para o espaço privado: `/studio`; entrada `/studio/access`. São rotas legíveis e documentadas operacionalmente, não um segredo criptográfico. Acesso por bookmark do proprietário. Redirecionamentos `returnTo` aceitam apenas destinos relativos permitidos sob `/studio`, bloqueando URLs externas, `//` e destinos ambíguos.

Guard privado verifica `/users/me`, exige `role=owner` e `status=active` antes de renderizar layout/dados. Tela neutra de verificação enquanto resolve sessão; falha de rede oferece retry, não é tratada automaticamente como logout. Guard no cliente não impede chamadas diretas à API.

O requisito atual é mais restrito que a API inspecionada: bloquear login e escrita de `author` no modo owner-only também no backend. Não codificar e-mail do proprietário como autorização no JS. Seed é o único provisionamento; não mostrar gerenciamento de múltiplos usuários na primeira interface. Manter modelo extensível sem habilitar funcionalidade não solicitada.

### 3.2 Para realmente impedir acesso externo ao login

Ocultar o link reduz descoberta casual; qualquer rota HTTP pública ainda pode ser descoberta. Proposta preferida para o uso pessoal: restringir `/studio` e `/api/v1/auth`, `/api/v1/users`, `/api/v1/admin` por rede privada/VPN ou controle de acesso no proxy, mantendo o mesmo origin público para simplificar cookies e CSRF.

A regra deve cobrir a página de login e todos os endpoints privados, não só o HTML. Denegar diretamente no proxy quando fora da rede autorizada, sem entregar formulário. Definir roteamento/origin da VPN e recuperação operacional antes do deploy; não confiar em headers de IP enviados pelo cliente. O frontend não escolhe nem contrata um provedor nesta etapa.

Se o proprietário optar por login acessível pela internet, manter URL sem links públicos, JWT/CSRF, owner-only e rate limit, reconhecendo que terceiros podem abrir o formulário. Essa opção não satisfaz literalmente a exigência de que ninguém de fora veja a entrada; a decisão de infraestrutura será confirmada antes do deploy.

### 3.3 Catálogo de design

Preferência: catálogo somente no servidor de desenvolvimento, por entry/build dedicado que importa `src/catalog` e `src/showcase`. Build de produção não deve ter rota, manifesto ou chunk contendo catálogo/exemplos; não basta `display:none`, lazy import ou uma flag `VITE_*` pública.

Remover import estático de `Catalog` do shell público e definir entradas distintas verificadas no build. Componentes/token CSS usados pelo blog continuam públicos: esconder o catálogo não torna o HTML/CSS do site secreto. Se for necessário catálogo remoto no futuro, usar preview interno autenticado, separado do deploy público.

Paths legados `#/design-system/*`, `#books`, `#editorial` não abrem o catálogo em produção. Retornar ao conteúdo público ou informar rota indisponível; nunca manter fallback que mostra overview do design. `/design-system` deve dar 404 real no servidor.

`noindex`/`X-Robots-Tag` nas respostas privadas e nenhuma entrada privada no sitemap. Robots.txt não é controle de acesso; não usá-lo como mapa de endereços supostamente secretos. Não publicar source maps de produção; código cliente, nomes de rotas e `VITE_*` jamais recebem segredos.

## 4. Rotas e arquitetura de navegação

| Rota frontend | Função | Regra |
| --- | --- | --- |
| `/` | Landing page | Pública, conteúdo editorial e artigos recentes |
| `/posts` | Biblioteca/listagem | Pública; `q` e `page` na URL |
| `/posts/{slug}` | Leitura | Pública; link direto, refresh e compartilhamento |
| `/about` | Sobre o autor | Pública; bio aprovada, sem e-mail de login |
| `/studio/access` | Login | Sem links públicos; preferencialmente protegido no proxy |
| `/studio/posts` | Painel editorial | Owner, status/página na URL privada |
| `/studio/posts/new` | Novo draft | Owner |
| `/studio/posts/{id}/edit` | Editor | Owner |
| `/studio/account` | Perfil, senha e sessões | Owner |
| Rota desconhecida | Página 404 | Não transformar em home ou catálogo |

Adotar roteador oficial Solid no lugar de hash routing. IDs de seção/TOC continuam fragmentos, e hashes antigos não conflitam com novos paths. Links de posts precisam ser `<a href>` reais, preservando abrir em nova aba, copiar link, teclado e navegação sem depender de callbacks.

Home → lista → artigo → voltar preserva filtros, página, scroll e foco do card de origem. Link direto no artigo oferece retorno determinístico à lista; não executar `history.back()` cegamente. Troca de rota move foco ao heading uma vez; evitar disputa entre router e `ArticlePage.onMount`.

## 5. Renderização, SEO e custo operacional

Um blog precisa de HTML de artigo e metadados no primeiro response, inclusive para previews sociais. A SPA Vite atual não garante isso. Proposta preferida: avaliar migração incremental para SolidStart com SSR público, preservando todos os componentes Solid e mantendo a API Rust como dona dos dados/auth. [SolidStart](https://docs.solidjs.com/solid-start) e [SSR no Solid Router](https://docs.solidjs.com/solid-router/rendering-modes/ssr) são as referências técnicas.

Fazer um spike antes de mudar a base: home, um artigo, 404 real, hidratação de `Book`, rotas diretas e consumo de memória no host. SSR adiciona processo/runtime e custo; se não couber, decidir explicitamente por prerender com publicação/invalidação automatizadas. Não assumir que artigos criados pela web aparecem em HTML estático sem rebuild.

Entrega recomendada: HTML dinâmico para home/lista/artigo/sobre; admin como shell privado interativo. Proxy encaminha `/api/v1` ao Rust, rotas web ao renderer e assets ao servidor estático. Nunca encaminhar requests de API para fallback de SPA ou devolver index.html em lugar de JSON.

SSR público usa somente endpoints públicos e não encaminha Cookie/Authorization do visitante. Serializar apenas o view model público necessário, sem dados privados ou estado de sessão. Nenhum store de usuário global compartilhado entre requests no servidor. Acesso a `window`, `document`, `matchMedia` e medição de elementos ocorre no ciclo cliente, não ao importar componentes.

URL canônica única `/posts/{slug}`. `title`, description, Open Graph, Twitter card e JSON-LD BlogPosting derivam do post público; imagem social depende da API de mídia. Datas ISO e escaping seguro inclusive no JSON-LD. Sitemap só contém publicados; geração tem de paginar a API completa, não só os 20 primeiros posts. Atualização/invalidação após publicação é tarefa de integração explícita.

Busca interna e combinações arbitrárias de parâmetros: noindex, canonical adequado; páginas normais da biblioteca têm URLs de página consistentes. Sem hreflang de artigo antes de existirem traduções reais. Não cadastrar `/en/posts/...` com duplicata artificial do mesmo conteúdo.

## 6. Direção da landing page

Conceito: um caderno de ideias que ganha escala de ambiente. O visitante primeiro reconhece Helder e o assunto do blog; depois vê folhas, livros e notas formando uma pequena oficina editorial em movimento. A ilustração é uma extensão dos elementos existentes, não uma troca de identidade por efeitos genéricos.

Manter tokens atuais, contraste e tipografia. Não adicionar gradientes decorativos, pesos acima de 700, itálico ornamental, cursores personalizados ou fontes concorrentes. O som fica desligado/inexistente. Nenhum depoimento, número de leitores, experiência profissional ou projeto é inventado para preencher a LP.

### 6.1 Sequência das seções

| Seção | Layout e conteúdo | Movimento/componente |
| --- | --- | --- |
| Header | Wordmark, Artigos, Sobre, idioma e tema | Navegação discreta; nada de login/design |
| Hero | Um H1 autoral, texto curto e CTA “Explorar artigos” | `EditorialScene` em escala de viewport, derivado de NotebookArt/Book |
| Publicações recentes | 3 posts desktop; quantidade responsiva sem ocultar todos | `PostGrid`/Book; conteúdo real, sem carrossel automático |
| Interlúdio visual | Oficina de folhas que se organizam em livros | Segunda cena ampla carregada sob demanda, fora do texto de leitura |
| Temas | Tags reais com contagem, texto que explica o foco | Badges agora; filtros clicáveis só com API apropriada |
| Sobre em poucas linhas | Foto/monograma aprovado e bio breve | `Author` adaptado + link para `/about` |
| Encerramento | Convite para ler a biblioteca e footer curto | Composição estática/leve, sem newsletter ou formulário sem backend |

Hero desktop: reservar aproximadamente `min-height: calc(100svh - header)` sem obrigar fullscreen da API. Ilustração pode ocupar 70–100% da largura e extravasar dentro de container recortado; H1/CTA mantêm zona estável e legível. Não usar `100vw` que provoque overflow por scrollbar.

Mobile: texto e CTA primeiro, ilustração abaixo com altura limitada e proporção própria; em telas baixas/landscape, altura intrínseca. Nenhum “gire seu aparelho”. O visitante consegue alcançar posts sem assistir a uma sequência inteira.

Proposta de texto, a validar: “Ideias em construção. Histórias para compartilhar.” Subtítulo descreve somente os temas que o proprietário aprovar. PT/EN entram em dicionários; não embutir frases essenciais dentro de SVG/imagem.

### 6.2 Estados da landing page

Posts carregando: skeleton na geometria final dos livros; hero e navegação continuam disponíveis. API falhou: aviso localizado e retry na seção, sem derrubar a página inteira. Nenhuma publicação: mensagem editorial honesta e link Sobre, sem exemplos fictícios passando por artigos reais.

Sem tags: omitir a seção de temas e preservar ritmo vertical; sem bio longa: usar texto curto aprovado. Capa ausente/falha: capa tipográfica do Book, nunca imagem quebrada. A landing page deve continuar compreensível com JavaScript de animação indisponível.

## 7. Ilustrações grandes: storyboard e execução

### 7.1 Cena A — caderno expandido do hero

Camadas propostas: base/papel, capa traseira, 3–5 folhas, linhas editoriais, livro/capa frontal, marca e 2–3 pequenos elementos orbitais. Reutilizar geometria/cores do NotebookArt; Book conserva sua construção própria. Separar camadas animadas do plano de texto HTML.

| Momento/camada | Proposta visual | Parâmetros iniciais para protótipo |
| --- | --- | --- |
| Composição inicial | Caderno grande aberto, identidade já legível | Estado estático aparece imediatamente; sem loader de entrada |
| Folhas | Separação ampla em leque e retorno | 40–120 px desktop, rotação ±8–14°, ciclo 8–12 s |
| Capa | Abertura/fechamento parcial com perspectiva | 10–18° local; ciclo 10–14 s; não girar o texto da página |
| Marca/pontos | Movimento orbital amplo e pausas | 12–20 s; poucos objetos e trajetória delimitada |
| Ponteiro | Profundidade sutil adicional no artwork | Máximo ±4°/12 px, só pointer:fine, nunca indispensável |

Movimento expressivo vem da amplitude e defasagem das folhas, não de centenas de partículas ou velocidade frenética. No mobile reduzir deslocamento para 16–40 px e até 3 folhas; sem hover, sensor de movimento ou exigência de arrastar. Quando pausada, cena congela em composição legível.

### 7.2 Cena B — oficina editorial de tela inteira

Interlúdio full-bleed com altura aproximada de uma viewport no desktop. Folhas se dispersam, alinham-se em pilha e formam duas ou três capas; elementos permanecem dentro da região da cena. Texto opcional curto fica em área separada. A passagem de visitante para artigos nunca depende de acertar um alvo animado.

Duas alternativas de protótipo, escolher uma após medir: loop de 14–18 s com pausas entre fases; ou progresso restrito ao scroll normal dentro da própria seção, com fallback estático. Não usar scroll hijacking, travar rolagem, pinning de várias telas ou revelar o texto somente quando uma animação termina.

O README atual veta scroll reveals e animação global de entrada. Manter essa regra no conteúdo/UI; a cena ilustrada expressiva é uma exceção explícita solicitada para a LP e deve ser documentada no Design System. Não transformar cada heading/card em animação de scroll.

### 7.3 Como construir com os componentes existentes

1. Criar storyboard estático desktop/mobile antes de motion; testar hierarquia, contraste e corte da composição.
2. Acrescentar `EditorialScene` e `MotionControl` ao Design System; compor/reutilizar `NotebookArt` e `Book` em vez de copiar markup em páginas.
3. Evoluir `NotebookArt` para receber variantes, escala, pausa externa e textos decorativos/localização; preservar uso compacto existente.
4. Preferir camadas CSS/SVG autorais e pequenos assets locais AVIF/WebP. Usar SVG para arte, não para substituir o sistema de ícones Lucide. Não gerar imagens nem implementar assets nesta etapa.
5. CSS keyframes para loops simples; Web Animations API para timelines coordenadas, cancelamento e pausa. Referência: [MDN Web Animations](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API).
6. Animar transform/opacity de wrappers, cada qual com transform-origin definido; separar hover, movimento de cena e transição de livro para não disputarem `transform`.
7. Usar IntersectionObserver para parar trabalho fora da viewport, `visibilitychange` para abas ocultas e `onCleanup` para observers/timers/Animation/RAF. [MDN Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API).
8. Aplicar uma atualização RAF por frame para ponteiro/scroll quando necessário; não atualizar signals/layout de toda a página a cada pixel. CSS keyframes dispensam loop JS contínuo.
9. Usar `will-change` temporário e poucas superfícies compostas; evitar grandes blur/filter/sombras animadas e camadas enormes em resolução excessiva.
10. Registrar variantes normal/mobile/reduced-motion/paused no catálogo de desenvolvimento antes de consumir na home.

Não adicionar GSAP, Lottie, Rive ou Three.js por padrão. Só avaliar biblioteca se o protótipo exigir morphing/rigging real e o ganho compensar bytes, manutenção e acessibilidade. A primeira direção é 2.5D com CSS/SVG, coerente com o sistema atual.

### 7.4 Acessibilidade e controles

`prefers-reduced-motion` inicia cenas estáticas, desliga parallax e substitui abertura de livro por navegação direta. Um controle visível e discreto “Pausar animações”/“Retomar animações” governa todas as cenas; preferências explícitas não devem reativar movimento contra reduced-motion sem escolha consciente.

Persistir apenas preferências não sensíveis, como tema/idioma/pausa. Conteúdo decorativo usa aria-hidden e não entra no tab order; foco permanece em controles estáveis. Nunca flashes rápidos, texto em loop sob o cursor ou CTA que foge do ponteiro. A necessidade de pausa para movimento prolongado é sustentada pelo [WCAG 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide).

### 7.5 Onde buscar inspiração e o que aproveitar

| Referência | O que observar para o moodboard | Tradução para este blog |
| --- | --- | --- |
| [Miranda — Paper Portfolio](https://www.niccolomiranda.com/) | Direção editorial, papel, tipografia e densidade visual | Hierarquia e materialidade com nossos tokens, sem copiar layout/arte |
| [Bruno Simon](https://bruno-simon.com/) | Construção de um universo autoral e descoberta lúdica | Uma cena memorável; não transformar a navegação do blog em jogo |
| [Lusion](https://lusion.co/) | Direção de experiências 3D/interativas e composição de grande escala | Profundidade e coreografia interpretadas em CSS/SVG leve |
| [Awwwards — Art & Illustration](https://www.awwwards.com/websites/art/) | Coleção de abordagens para comparar composição e ilustração | Selecionar 3 referências, anotar decisões e evitar copiar tendências em bloco |

As aplicações acima são propostas de interpretação criativa; não representam inspeção frame a frame das animações desses sites. Na fase visual, capturar referências permitidas, desenhar arte original e registrar licença de fontes/texturas. Nunca reutilizar ilustração, marca ou arquivo de terceiro sem licença.

## 8. Biblioteca e pesquisa pública

`/posts` é uma estante editorial com título curto, busca, contagem de resultados e grid. Desktop 3 colunas, tablet 2, mobile 1, aproveitando PostGrid. Verificar títulos longos sem truncar o significado e reservar altura para capas. Não aninhar botões/links de tag dentro do link principal do card.

Busca: input com label visível/acessível, debounce inicial de 300 ms, Enter para executar imediatamente, limpar acessível e query normalizada na URL. Usar `replaceState` durante digitação e histórico coerente para pesquisa confirmada; voltar restaura estado sem redigitar.

Requisições com AbortController e identificador de versão evitam que resposta antiga substitua a busca atual. String vazia usa `/posts`; texto usa `/posts/search`. Página muda `offset=(page-1)*limit`, com `limit` inicial 12; usar total real para quantidade de páginas. Mudança de q/filtro reinicia página 1.

O `Pagination` atual é um specimen de quatro páginas: torná-lo controlado por total/page/limit e documentar no DS antes de usar. Navegação tem links reais, aria-current e disabled correto. Se deletar conteúdo e página ficar além do total, redirecionar para a última página válida.

Tags hoje podem ser exibidas como metadados e contagens reais. O alvo final inclui filtro por tag e combinações com pesquisa, mas requer extensão de endpoint/DTO; até lá, não mostrar chips clicáveis que fazem nada nem oferecer busca textual como se fosse filtro exato. Data, autor, ordenação e locale seguem a mesma regra.

Sem resultados: EmptyState com query preservada e ação limpar busca. Erro de primeira carga: Alert e retry. Erro de atualização: manter a lista anterior identificada como desatualizada, sem apresentar o total antigo como resultado novo. Não fazer scroll infinito na primeira entrega; paginação melhora retorno, footer e compartilhamento.

DTO → view model: `summary` vira descrição, primeira tag pode ocupar a área visual antes chamada category, demais tags continuam visíveis quando houver espaço. Sem tag, usar rótulo editorial neutro localizado. Datas reais via Intl. Não preencher readingTime com valor de mock nem baixar o corpo de todos os posts para calculá-lo.

## 9. Leitura dos artigos

Evoluir `ArticlePage`, preservando Newsreader e largura de leitura aproximada de 65–75 caracteres. Título, resumo, tags, autor público, data, capa e corpo. Texto-base inicial de 18–20 px desktop, 17–18 px mobile, entrelinha confortável e contraste testado nos dois temas. Nenhuma animação contínua durante leitura.

Criar `ArticleProse` no Design System para o HTML sanitizado vindo da API. A inserção de HTML fica isolada nesse componente, somente para `content_html`/preview da API confiável; títulos, resumos, tags e mensagens sempre como texto. Não renderizar Markdown arbitrário recebido pela URL nem usar HTML de mocks como prova de segurança.

Validar o pipeline com scripts, atributos perigosos, links e mídia; CSP e política de imagens complementam a sanitização. Imagens externas hoje podem aparecer no Markdown aceito pelo backend: decidir allowlist/política de rastreamento antes de publicar. Não supor que todas já passam por storage privado.

Suportar headings, listas, tabelas, citações, links e código. Tabelas/código rolam horizontalmente apenas no próprio bloco; não alargar a página. Botão copiar código informa sucesso/falha. Syntax highlighting opcional carregado apenas para linguagens presentes, sem pacote completo no shell público.

Sumário para artigos longos: gerar anchors determinísticas de headings do HTML, tratar títulos repetidos e definir `scroll-margin-top`. Lista lateral desktop; Accordion mobile. Scroll spy não rouba foco nem reescreve histórico a cada heading. Barra de progresso é opcional e sem anúncio contínuo por leitor de tela.

Compartilhar: Web Share quando disponível e copiar URL canônica como fallback; sem widgets rastreadores de redes sociais. Imprimir esconde navegação/controles e preserva conteúdo. Relacionados inicialmente podem ser “Mais artigos” recentes excluindo o atual; chamar de relacionados por tema somente quando houver consulta apropriada.

404 de artigo invisível/excluído apresenta mensagem pública neutra, sem revelar draft ou pedir login para ler. Falha 5xx tem retry, não é “artigo não encontrado”. No SSR, preservar status HTTP real. Dados de autoria não vêm de `/users/me`; até existir perfil público, usar somente bio pública aprovada do proprietário.

### 9.1 Transição Book → artigo

Manter a interação existente como melhoria progressiva em click normal. Pré-carregar detalhe em hover/foco com orçamento baixo; não buscar todos os artigos por antecipação. Click com Ctrl/Meta, middle click, nova aba e reduced-motion usam navegação normal.

Iniciar animação só com card conectado, viewport adequada e destino resolvido; cancelar em navegação concorrente/desmontagem/resize crítico. Falha de fetch não deve terminar em tela em branco nem deixar clone/overlay preso. Se a rede estiver lenta, priorizar página de leitura com skeleton sem obrigar espera por motion.

Clones animados têm aria-hidden/inert e IDs removidos; foco muda ao H1 após navegação, restaura ao voltar. Testar retorno pela barra do navegador, scroll preservado e card ausente por filtros novos. Transição não pode alterar o histórico duas vezes.

## 10. Autenticação no frontend

Cliente HTTP único com base relativa `/api/v1`, timeout/cancelamento e parsing de erro robusto. Cookies são enviados pelo navegador com credentials same-origin; nunca ler/gravar JWT via JS nem montar Authorization manualmente. Não tentar definir Origin pelo JS: configurar proxy/origin corretamente.

Desenvolvimento: proxy Vite `/api` para o Rust e `APP_ORIGIN` igual ao origin do navegador, sem reescrever Origin para o destino. Produção: HTTPS, cookies Secure, gateway privado e proxy coerentes. Nenhum e-mail/senha/key real em `.env`, `VITE_*`, fixtures, documentação ou imagem do frontend.

Bootstrap só no espaço privado: estado `unknown` → consulta `/users/me` → `authenticated` com owner ativo; em 401, obter CSRF via `/auth/csrf`, tentar `/auth/refresh` uma vez e consultar perfil novamente. Token CSRF vem do login ou endpoint e fica apenas em memória.

Mutações enviam `X-CSRF-Token`; multipart futuro não recebe Content-Type manual, para preservar boundary. Erro de CSRF permite atualizar token uma vez, sem loop; não confundir com papel proibido. Sessão expirada limpa cache privado, cancela requests e remove dados da interface.

Renovação é single-flight dentro da aba e coordenada entre abas via Web Locks + BroadcastChannel quando disponível. Canal transmite eventos, nunca tokens/credenciais. Após adquirir lock, revalidar sessão antes de rotacionar; outra aba pode já tê-la renovado. Política alternativa sem suporte deve ser explícita, evitando refresh concorrente que cause revogação por replay.

Repetir GET após refresh no máximo uma vez. Para escrita, só repetir automaticamente quando a resposta garante rejeição antes da mutação; timeout/falha de rede pode ter ocorrido após commit. Preservar texto e reconciliar via leitura/versão antes de nova tentativa. Criação pode duplicar sem chave de idempotência: não prometer retry transparente.

Login: e-mail, senha com autocomplete apropriado, mostrar/ocultar senha, feedback genérico, estado submitting e prevenção de double click. Sem “lembrar senha”, cadastro ou recuperação por e-mail inexistente. Recuperação é procedimento operacional/CLI; não publicar instruções sensíveis na página.

Logout chama API antes de declarar sessão encerrada; indisponibilidade informa que revogação não foi confirmada. Limpar dados locais mesmo assim para não expor editor, mas não afirmar que cookies HttpOnly foram removidos por JS. Broadcast de logout bloqueia outras abas e limpa previews; rascunho sujo recebe opção de exportação quando apropriado antes da ação voluntária.

## 11. Painel editorial e editor

Painel com lista, status, título, atualização e ações. Usar layout do DS, não framework administrativo externo. Paginação por offset; filtro `status` conforme API. Busca global no admin não existe no DTO atual: planejar extensão ou não oferecer campo que busca só a página sem explicação.

Criar post sempre com `status: draft` explicitamente, embora a API aceite outro estado. Campos: título, resumo (`summary`), Markdown (`content_md`), tags por nomes e capa quando a API de mídia existir. Salvar e publicar são ações separadas.

Título 1–160 caracteres, resumo até 320, Markdown até 256 KiB, até 10 tags de 1–40 caracteres. Validar caracteres com semântica compatível com Rust e bytes UTF-8 com TextEncoder. Corpo JSON atual é limitado a 384 KiB; escapes podem aumentar tamanho. Erros do servidor continuam sendo a autoridade.

Editor inicial com textarea acessível e toolbar leve de inserção Markdown, respeitando undo/redo nativos. Layout split desktop com preview à direita, abas Editar/Visualizar no mobile. CodeMirror só se edição demonstrar necessidade e com carregamento privado sob demanda; não instalar um editor WYSIWYG que altere o formato canônico.

Preview usa `POST /admin/posts/preview` com `{content_md}` e CSRF. Debounce de 600–800 ms, cancelar resposta obsoleta, pausar ao ocultar preview. Erro mantém texto e último preview identificado como desatualizado. Não abrir endpoint público alternativo de preview.

Guardar ETag retornado no GET/create/PATCH e enviá-lo literalmente em `If-Match` nas escritas versionadas. Substituir pelo novo ETag após sucesso. Campo `version` do JSON pode ser enviado conforme DTO, mas header é a autoridade no handler atual.

412: manter versão local, carregar nova versão em separado e mostrar comparação com ações copiar/exportar/mesclar. Não sobrescrever automaticamente. 428 indica falha de integração ao perder ETag, não erro de digitação do usuário. Alterações ainda não salvas não somem após erro.

Salvar post publicado atualiza imediatamente o público; exibir aviso contextual antes da ação. Publicar chama endpoint dedicado; despublicar volta a draft. Arquivar pode usar PATCH `status: archived` como retirada reversível; recuperar do arquivo usa draft e exige nova publicação. Não chamar isso de lixeira.

DELETE atual é definitivo. Dialog descreve efeito, exige confirmação do título e oferece arquivar como alternativa. Não mostrar toast “Desfazer” sem API de restore. Botão de agendamento fica fora da entrega até worker/semântica de datas serem confirmados.

Importar `.md` no browser: validar extensão/tamanho/UTF-8, carregar para buffer de edição e exigir confirmação antes de substituir texto. Não publicar automaticamente. Exportar buffer ou versão salva usa Blob/URL temporária e revoga object URL depois; filename seguro, conteúdo sem segredos. Front matter não deve ser interpretado silenciosamente.

Rascunho não salvo fica em memória; não persistir em localStorage/IndexedDB por padrão. Aviso ao navegar/recarregar e download `.md` explícito ajudam a evitar perda. Não prometer recuperação após fechamento sem storage. Autosave fica desligado inicialmente, especialmente em posts publicados; pode evoluir para drafts com ETag e fila única.

### 11.1 Capa, tags, conta e sessões

Tags no editor usam componente acessível de chips/input; `tags: []` remove todas as associações. API cria nomes junto ao save. Catálogo público de tags só contém temas publicados e pode não listar tags de drafts; considerar o conjunto local do post, sem supor que tudo vem de `/tags`.

Capa exige upload real, progresso, erro, preview, crop/posição opcional e alt. Como falta contrato de mídia, especificar endpoint/tamanho/URL/alt/dimensões/autorização antes de desenvolver o fluxo. Não pedir ao proprietário um ID manual nem salvar base64 no JSON. Placeholder tipográfico é fallback visual, não implementação completa de imagens.

Conta: nome/bio, troca de senha e sessões próprias. Não pré-preencher senha; desativação de conta/papéis não entra na UI inicial de proprietário único. Após troca, seguir a política real da API e forçar novo login na experiência se necessário, sem presumir quais sessões foram revogadas.

Sessões: data/dispositivo/is_current, revogar específica e encerrar todas. Não expor tokens. Ações destrutivas requerem confirmação e estados de erro; nomes de user-agent são texto não confiável. Nenhum segredo aparece em Toast ou relatório de analytics.

## 12. Evoluções do Design System antes das páginas

| Item | Evolução planejada |
| --- | --- |
| `PostCard`/`PostGrid` | IDs/slugs/href reais, tags, metadata opcional, capa fallback e link semântica |
| `ArticlePage` | Back href, autor real, alt de capa, TOC slot, títulos/datas opcionais e foco coordenado |
| `Pagination` | Total/page/limit reais, elipses, links e estados limites |
| `NotebookArt` | Pausa externa, escala de cena, textos localizados e variantes responsivas |
| `EditorialScene` | Novo componente de ilustração grande, 2 cenas, lifecycle e fallback estático |
| `MotionControl` | Preferência global de movimento sem acoplar ao catálogo |
| `ArticleProse` | Tipografia de conteúdo, tabela/código, HTML seguro e anchors |
| `SearchField`/`TagInput` | Semântica, teclado, limpar, sugestões e limites |
| `PasswordField` | Mostrar senha acessível, autocomplete, mensagens associadas |
| `EditorToolbar`/`MarkdownEditor` | Inserção de Markdown e preview composto, sem lógica HTTP no DS |
| `FileUpload`/`MediaPreview` | Progresso/falhas e texto alternativo, após fechar contrato de mídia |
| `AdminTable`/`StatusBadge` | Lista responsiva, estados editoriais e ações com nomes explícitos |

Reutilizar Field, Button, Dialog, Toast, Alert, EmptyState, Skeleton, Presence, Accordion e Icon em todos os fluxos. Novos componentes recebem exemplos PT/EN, claro/escuro, teclado, disabled/loading/error/reduced-motion no catálogo local. Não duplicar componentes por página.

A marca/monograma “h.” atual em ArticlePage não substitui autoria futura; torná-lo configurável antes de múltiplos autores. Corrigir href `#editorial` do componente para rota de produto. Mover dicionários compartilhados de `showcase` para `i18n`, para o blog não depender de arquivos do catálogo.

## 13. Organização proposta dos módulos

`src/app/`: router, shells público/privado, providers mínimos e fronteiras de erro. `src/pages/`: composição de home, posts, article, about e studio. `src/features/`: posts, search, auth, editor e account. `src/lib/api/`: cliente, DTOs, mappers e erros. `src/i18n/`: dicionários/formatadores. `src/design-system/`: componentes, tokens e motion. `src/catalog/`: entrada exclusivamente de desenvolvimento.

Cada feature separa acesso a dados, estado e UI. Não transformar App.tsx em router+auth+editor+landing monolítico. Preferir primitivas Solid e API fetch nativa; biblioteca de server state só após necessidade demonstrada. Validar formato mínimo de respostas; TypeScript não valida JSON de rede.

Centralizar mappers para `summary → description`, datas Unix, status e resoluções de mídia. Não espalhar adaptação pela UI. Paginação/chave de cache inclui query/status/página; dados privados incluem identidade da sessão e são descartados em logout. Sem singleton global de sessão no SSR.

Manter todo arquivo manual abaixo de 500 linhas. Evitar comentários triviais, blocos multilinha e estilos duplicados. Código/nomes/testes em inglês; conteúdo UI em dicionários PT/EN. Nenhum arquivo de ferramenta/agente dentro do sub-repositório.

## 14. Acessibilidade, responsividade e preferências

Testar 320 px até monitores largos, zoom de 200–400%, teclado, leitor de tela e touch. Conteúdo reflow sem scroll horizontal global; alvos interativos confortáveis, foco visível imediato, skip link e landmarks consistentes. Não depender de hover para ler resumo ou acessar ações.

Dialog existente mantém foco/escape/restauração; páginas controlam o trigger. Alert dinâmico recebe live region adequada; Toast não é o único lugar para erro de formulário. Skeleton é decorativo e região anuncia carregamento de forma concisa. Não anunciar cada tecla da busca nem cada frame de progresso.

Tema/idioma seguem preferência persistida e fallback do sistema, com bootstrap que evita flash incompatível com SSR/CSP. Locale atual `pt` da UI mapeia `pt-BR` no documento/Intl. Idioma de interface não reescreve o idioma do artigo; registrar locale do conteúdo no backend antes de lançar suporte editorial multilíngue completo.

Motion reduzido, pausa, Save-Data quando disponível e largura/altura limitada geram arte estática ou simplificada. Texto/ações não mudam de posição devido à animação. Print stylesheet mantém artigo legível, capa opcional e links úteis.

## 15. Desempenho e segurança na entrega

Metas iniciais, a medir em aparelho móvel intermediário: LCP ≤2,5 s, INP ≤200 ms, CLS ≤0,1 no percentil 75 quando houver amostra real. [Referência: Web Vitals](https://web.dev/articles/vitals). Antes de tráfego suficiente, usar testes de laboratório como aproximação, sem chamar pontuação de garantia de produção.

Orçamento proposto: JS inicial público até 120 KiB gzip; assets visuais/fontes iniciais até 500 KiB transferidos; sem runtime de editor/catálogo no caminho público. Validar compatibilidade com SSR escolhido, ajustar com evidência e registrar desvios antes do aceite.

Priorizar H1 e imagem/artwork principal; tamanhos reservados para evitar CLS, fontes WOFF2 locais/subsets licenciados quando possível, poucas variações e font-display adequado. Capa do artigo acima da dobra não é lazy; imagens abaixo são lazy, com dimensões e formatos modernos. Não baixar todas as capas em resolução máxima.

Uma cena grande ativa por vez; demais pausadas/offscreen. Procurar 60 fps no alvo e frame estável, medindo CPU/GPU/memória; reduzir camadas/amplitude quando exceder orçamento, em vez de bloquear leitura. `will-change` permanente e textures gigantes aumentam memória mesmo sem JS pesado.

Caches públicos respeitam política da API. Hoje posts podem permanecer até 60 s e tags até 300 s após mudança; invalidar cache cliente não remove caches compartilhados. Para exigir retirada imediata, planejar ajuste API/proxy para revalidação ou purge antes do lançamento. Admin/auth no-store; nenhum service worker cacheia credenciais, drafts ou respostas privadas.

HTTPS, CSP, referrer policy, nosniff, noindex privado e dependências auditadas. HTML sanitizado não permite ignorar política de imagens/links. Não logar payloads do editor, senha, cookies ou CSRF em console, error tracker ou replay de sessão. Analytics inicial opcional e agregado, sem gravar a área administrativa.

## 16. Plano de testes e validação

| Área | Critérios mínimos |
| --- | --- |
| Rotas públicas | Home/lista/artigo/sobre por link direto, refresh, histórico, 404/5xx e HTML inicial indexável |
| Discrição/acesso | Nenhum link login/design público; catálogo ausente de dist; acesso privado sem dados antes de autorização |
| Owner-only | Conta não-owner negada no frontend e na API; navegação forçada não libera recursos |
| Sessão | Login, csrf, expiração, refresh único/múltiplas abas, logout, rede offline e limpeza de cache |
| Posts | Listagem/busca/paginação reais, vazio, data/timezone, caracteres especiais e respostas fora de ordem |
| Editor | Draft, preview, salvar/publicar/despublicar/arquivar, exclusão definitiva, tags e payloads grandes |
| Concorrência | ETag preservado, 412 sem perda local, 428 detectado, timeout sem duplicação automática |
| HTML/mídia | XSS, links, tabela, código, capa ausente, upload inválido e alt quando integração existir |
| Motion | Reduced-motion, pausa, aba oculta, scroll rápido, pointer coarse, cleanup e navegação durante Book transition |
| Acessibilidade | Teclado completo, leitor de tela, foco, contraste, zoom e controles sem motion |
| Operação | Proxy/origin/cookies, cache após despublicação, SSR sem vazamento entre requests e gate privado no deploy |

Testes unitários de mappers/estado e componentes críticos; integração com contratos reais; E2E em navegador para visitante e proprietário. Fixtures com dados fictícios, nunca credenciais reais. Usar testes de regressão visual para DS/cenas nos dois temas e em mobile; comparar estáticos com motion pausado.

Não alegar que screenshots de mock validam autenticação. Cenário final: visitante lê sem cookies → owner entra pelo acesso privado → cria draft → adiciona capa → preview → publica → visitante encontra e lê → owner despublica → política de cache observada → logout bloqueia escrita.

## 17. Etapas e gates de conclusão

1. **Contratos e política:** confirmar owner-only, endereço/gate privado, divergências de API, mapeamento DTO e prioridade de mídia/filtros. Registrar testes de contrato antes das telas.
2. **Estrutura web:** separar catálogo, roteamento real, proxy e i18n; spike SSR/custo com ArticlePage. Gate: público indexável, sem catálogo em produção.
3. **Design System:** adaptar cards/links/paginação/article e criar componentes faltantes com todos os estados.
4. **Experiência pública:** biblioteca, busca e leitura reais; remover mocks do caminho de produção. Gate: links diretos e erros corretos sem login.
5. **LP visual:** storyboard, arte estática, duas cenas, motion, pausa e mobile. Gate: desempenho/acessibilidade medidos e fallback estático completo.
6. **Autenticação privada:** owner guard, cookies/CSRF, refresh coordenado e logout. Gate: terceiros não recebem dados e não há segredos no bundle.
7. **Editor:** CRUD, preview, ETag, import/export local, arquivo/exclusão e estados de falha. Gate: texto preservado em conflito/expiração.
8. **Contratos pendentes:** integrar mídia/alt e filtros reais após API pronta; não chamar entrega editorial completa sem imagens funcionais.
9. **Conta e operação:** perfil/senha/sessões, SEO/sitemap, cache, backups operacionais e proteção do proxy.
10. **Validação final:** build/typecheck, testes, revisão responsiva/visual, análise de dist, limites de arquivos e revisão pelo validador em cada etapa futura.

Cada etapa deve produzir um diff revisável; componentes vêm antes das páginas consumidoras. Não modificar os trabalhos locais preexistentes sem entender suas mudanças. Commits futuros por responsabilidade, sem misturar reestruturação, auth e arte em uma única alteração.

## 18. Decisões reservadas ao início da implementação

Defaults propostos: proprietário único, catálogo local, área privada `/studio`, gateway privado preferido, interface PT/EN, publicações com idioma atual sem tradução inventada, SSR público sujeito ao orçamento, motion expressivo limitado à arte, edição manual sem autosave e confirmação explícita de exclusão definitiva.

Confirmar apenas o que exige escolha real: domínio/host e viabilidade do acesso privado; bio/copy e assets autorais; publicação com imagem e contrato correspondente; política de cache ao retirar posts; preferência por novas traduções e necessidade real de agendamento. Os demais comportamentos estão especificados para permitir execução futura sem decisões improvisadas.

Este documento é o único entregável desta etapa. Não altera o backend nem implementa o frontend, e não contém credenciais. As referências externas foram consultadas para orientar a proposta; versões e capacidades serão revalidadas no início da implementação.
