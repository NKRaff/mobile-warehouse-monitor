# Documentação de Estudo — `src/app` (mobile-warehouse-monitor)

> Repositório: [NKRaff/mobile-warehouse-monitor](https://github.com/NKRaff/mobile-warehouse-monitor)
> Foco: código e funcionalidades das telas em `src/app`. A estrutura de pastas é abordada apenas o suficiente para contextualizar o roteamento.

## Visão geral do projeto

É um app **Expo (React Native + TypeScript)** que usa o **Expo Router** (roteamento baseado em arquivos, similar ao Next.js). O app é o painel de monitoramento de um sistema de telemetria de armazém: ele consome uma API REST (via Axios, em `src/service/api.ts`) para gerenciar **Ambientes** (setores/câmaras), **Dispositivos** (sensores IoT), **Notificações** (alertas de temperatura/umidade fora da faixa) e **Usuários** (autenticação e perfil).

Principais dependências relevantes: `expo-router`, `axios`, `@react-native-async-storage/async-storage`, `@react-native-picker/picker`, `@expo/vector-icons`.

---

## 1. Estrutura de rotas (Expo Router)

O Expo Router usa o sistema de arquivos como definição de rotas. Cada pasta/arquivo dentro de `src/app` vira uma rota; arquivos entre parênteses `(nome)` são **route groups** — organizam rotas sem adicionar segmento na URL.

```
src/app/
├── _layout.tsx                     # Layout raiz (Slot global)
├── (auth)/                         # Grupo de autenticação
│   ├── _layout.tsx                 # Stack com AuthProvider
│   └── index.tsx                   # Tela de Login
└── (dashboard)/                    # Grupo do painel principal
    ├── _layout.tsx                 # Tabs (bottom navigation)
    ├── ambientes/
    │   ├── _layout.tsx              # Stack de Ambientes
    │   ├── index.tsx                 # Listagem de ambientes
    │   ├── cadastro.tsx              # Criar/editar ambiente
    │   └── [id].tsx                  # Detalhe de um ambiente (rota dinâmica)
    ├── dispositivos/
    │   ├── _layout.tsx
    │   ├── index.tsx                 # Listagem de dispositivos IoT
    │   └── cadastro.tsx               # Criar/editar dispositivo
    ├── notificacoes/
    │   ├── _layout.tsx
    │   └── index.tsx                  # Listagem de alertas
    └── usuarios/
        ├── _layout.tsx
        ├── index.tsx                  # Perfil do usuário logado
        └── cadastro.tsx                # Criar novo operador/usuário
```

Duas dependências externas ao `src/app`, mas usadas por praticamente todas as telas:

- **`src/service/api.ts`** — instância do Axios (`baseURL` via `EXPO_PUBLIC_API_URL`, fallback `http://localhost:3000`) com um *interceptor* de resposta: se a API retornar `401`, limpa o `userId` salvo no `AsyncStorage` e redireciona para `/(auth)`.
- **`src/contexts/AuthContext.tsx`** — Context API simples que guarda `userId` em `AsyncStorage` (persistência local) e expõe `useAuth()` com `userId` e `setUserId`.

---

## 2. `_layout.tsx` (raiz)

```tsx
export default function RootLayout() {
  return <Slot />;
}
```

Apenas renderiza o `<Slot />` do Expo Router, ou seja, delega toda a estrutura visual para os grupos filhos (`(auth)` e `(dashboard)`). Há um comentário indicando um ponto de extensão para Providers globais (tema, Redux etc.), hoje não utilizado.

---

## 3. Grupo `(auth)` — Autenticação

### 3.1 `_layout.tsx`

Envolve a rota `index` num `AuthProvider` (disponibiliza `useAuth()` para a tela de login) e usa `Stack` do Expo Router com `headerShown: false` (sem cabeçalho nativo).

### 3.2 `index.tsx` — Tela de Login

**Funcionalidade:** autenticação do usuário via e-mail/senha.

Fluxo de `handleLogin`:
1. Valida se `email` e `senha` foram preenchidos (senão exibe modal de aviso).
2. Faz `POST /autenticacao` com `{ email, senha }`.
3. Recebe `{ id }` na resposta e persiste via `setUserId(id)` (grava no `AsyncStorage` através do `AuthContext`).
4. Redireciona com `router.replace('../ambientes')` para o dashboard.
5. Trata erros: `400` → "e-mail ou senha incorretos"; `Network Error` → mensagem de falha de conexão; outros → mensagem genérica.

**UI:** formulário simples com `TextInput` (e-mail e senha com `secureTextEntry`), botão com `ActivityIndicator` enquanto `loading`, e um **modal customizado reutilizável** (padrão repetido em quase todas as telas do app) que substitui `Alert.alert` por um diálogo estilizado com ícone, título, mensagem e botões de confirmar/cancelar — o tipo (`success` | `warning` | `confirm`) determina cor do ícone e do botão de destaque.

---

## 4. Grupo `(dashboard)` — Painel principal

### 4.1 `_layout.tsx`

Define a navegação por abas (`Tabs`) com 4 abas: **Ambientes**, **Dispositivos**, **Notificações** e **Usuários**, cada uma com ícone do `Ionicons` (versão preenchida quando focada, contorno quando não). Cor ativa `#4F46E5` (indigo), inativa `#64748B` (slate). `headerShown: false` — cada subgrupo define seu próprio cabeçalho via `Stack`.

---

### 4.2 Sub-rota `ambientes/` — Setores de armazenamento

#### `_layout.tsx`
`Stack` com três telas: `index` ("Meus Ambientes"), `cadastro` ("Novo Ambiente") e `[id]` (detalhe, título vazio pois o próprio conteúdo exibe o nome).

#### `index.tsx` — Listagem de ambientes

**Modelo de dados:**
```ts
interface Ambiente {
  id: string;
  nome: string;
  tipo: 'frio' | 'arejado' | string;
  descricao: string;
  temperatura_minima: number;
  temperatura_maxima: number;
  umidade_minima: number;
  umidade_maxima: number;
}
```

**Funcionalidade principal:**
- `fetchAmbientes()`: busca `GET /ambiente/` e, **para cada ambiente**, dispara em paralelo duas chamadas `POST /medicao/buscar-ultima` (uma para `tipo: 'temperatura'`, outra para `tipo: 'umidade'`) a fim de montar um mapa `telemetrias: Record<ambienteId, {temperatura, umidade}>` com a última leitura de cada sensor. Falhas individuais são capturadas com `.catch(() => null)` para não travar a tela inteira caso um ambiente ainda não tenha telemetria.
- `useFocusEffect` dispara o fetch toda vez que a tela ganha foco (ex.: ao voltar de outra aba), garantindo dados atualizados.
- Cálculo de **status agregado**: percorre todos os ambientes comparando o valor atual de temperatura/umidade contra os limites mínimo/máximo cadastrados (`temperatura_minima/maxima`, `umidade_minima/maxima`). Se nenhum valor foi lido ainda, considera "seguro" por padrão (evita falso alarme antes da primeira leitura). Conta quantos ambientes estão fora da faixa (`numCriticos`) e monta uma faixa de status no topo da tela ("Todos os ambientes estão normais" / "N ambiente(s) fora dos limites" / "Sincronizando dados...").
- Cada card (`renderAmbienteCard`) mostra ícone de tipo (❄️ frio / 🌿 arejado / termômetro genérico), nome, tipo+descrição, um badge **IDEAL/CRÍTICO**, e os dois valores de telemetria (temperatura e umidade) com ícone colorido em vermelho quando fora da faixa.
- Toque no card navega para `/(dashboard)/ambientes/[id]`, passando **todos os dados do ambiente como parâmetros de rota** (evita nova requisição de "detalhes básicos" na tela seguinte).
- Botão flutuante (FAB) leva para `/ambientes/cadastro` (novo ambiente).
- Pull-to-refresh via prop `refreshing`/`onRefresh` do `FlatList`.

#### `cadastro.tsx` — Criar/editar ambiente

Tela dupla-propósito (**criação** e **edição**), decidida por `isEditing = !!params.id` (os parâmetros vêm da rota, populados quando se navega a partir da tela de detalhe para editar).

**Campos do formulário:** nome, tipo (`Picker` com opções "Frio" / "Arejado"), descrição opcional, e quatro limites numéricos: temperatura mínima/máxima e umidade mínima/máxima.

**Validações antes de salvar:**
- Nome obrigatório.
- Todos os 4 limites obrigatórios.

**Submissão (`handleSalvar`):**
- Se `isEditing`: `PATCH /ambiente/{id}`.
- Senão: `POST /ambiente/`.
- Números são convertidos com `parseFloat(valor.replace(',', '.'))`, tratando o separador decimal em vírgula (padrão brasileiro) antes de converter para o formato usado pela API.
- Em sucesso, mostra modal e ao confirmar chama `router.back()`.

#### `[id].tsx` — Detalhe do ambiente (rota dinâmica)

Tela mais complexa do módulo. Recebe todos os parâmetros do ambiente via `useLocalSearchParams` (nome, tipo, descrição, limites) — não busca esses dados básicos de novo na API, só a telemetria.

**Dados carregados (`fetchTelemetria`):**
- Última medição de temperatura (`POST /medicao/buscar-ultima`).
- Última medição de umidade (idem).
- Histórico das últimas 24h (`POST /medicao/buscar`, com `startData` calculado como "agora − 24h"), ordenado do mais recente para o mais antigo.

Nota: o `useEffect` que dispara `fetchTelemetria` tem `[tempAtual, umiAtual]` como dependências — ou seja, ele roda de novo sempre que esses estados mudam, o que também acontece dentro da própria função (efeito de "auto-atualização" ao receber nova leitura).

**Cálculo de segurança:** `isTempSegura`/`isUmiSegura` comparam o valor atual contra os limites recebidos por parâmetro (com fallback: 0–40 °C e 0–100% se os parâmetros vierem vazios).

**Histórico visual (`renderGraficoLinha`):** para cada medição, desenha uma "barra" horizontal cujo preenchimento é proporcional ao valor (`valorMaximoRegua` é `max(limite_max * 1.3, 40)` para temperatura, ou fixo 100 para umidade), colorida em vermelho quando o valor está fora da faixa seguraura configurada. O histórico é **separado por tipo** (temperatura / umidade) e limitado às 5 leituras mais recentes de cada.

**Ações disponíveis:**
- Editar → navega para `cadastro.tsx` levando todos os parâmetros atuais (pré-preenche o formulário de edição).
- Excluir → abre modal de confirmação (`type: 'confirm'`); ao confirmar, chama `DELETE /ambiente/{id}` e, em caso de sucesso, `router.replace('/ambientes')`.
- Pull-to-refresh via `RefreshControl` dentro do `ScrollView`.

---

### 4.3 Sub-rota `dispositivos/` — Sensores IoT

#### `_layout.tsx`
`Stack` com `index` ("Meus Dispositivos") e `cadastro` (título dinâmico, vazio por padrão).

#### `index.tsx` — Listagem de dispositivos

**Funcionalidade:**
- `fetchDispositivos()` busca em paralelo `GET /dispositivo/` e `GET /ambiente/`, usando a segunda chamada apenas para montar um mapa `id → nome` de ambientes (assim o card do dispositivo pode mostrar o **nome amigável** do ambiente vinculado, em vez do UUID cru).
- Cada card mostra: ícone de chip, nome do dispositivo (ou "Dispositivo Sem Nome"), o `id` como "MAC" e, se vinculado, o nome do ambiente. Badge fixo "Ativo" (indicador visual verde), não há lógica condicional de status aqui.
- Toque no card → navega para `cadastro.tsx` levando `id`, `nome` e `ambienteId` (modo edição).
- FAB → `dispositivos/cadastro` (modo criação).

#### `cadastro.tsx` — Criar/editar dispositivo

**Funcionalidade:**
1. Ao montar, busca `GET /ambiente/` para popular um `Picker` de vínculo; se for um cadastro novo e existirem ambientes, pré-seleciona o primeiro da lista.
2. **Máscara de MAC address** (`handleMacChange`): remove tudo que não seja `0-9A-F`, limita a 12 caracteres e insere `:` a cada 2 caracteres, resultando no formato `XX:XX:XX:XX:XX:XX`. Em modo edição, o campo de MAC fica desabilitado (`editable={!isEditing}`) — o identificador de hardware não pode ser alterado depois de criado.
3. `handleSalvar`: valida que o MAC tem exatamente 17 caracteres (12 hex + 5 separadores). Se `isEditing`, `PATCH /dispositivo/{id}` só com `nome`/`ambienteId`; senão `POST /dispositivo/` enviando também `id: macId` (o MAC vira a própria chave primária do dispositivo).
4. `handleDeletar`/`executarDelecao`: fluxo de confirmação + `DELETE /dispositivo/{id}`, disponível apenas quando `isEditing`.
5. O `Picker` de ambiente inclui a opção especial `"⚠️ Deixar sem vínculo (Em Estoque)"` (`value=""`), permitindo cadastrar um sensor ainda não instalado em nenhum setor.

---

### 4.4 Sub-rota `notificacoes/` — Alertas

#### `_layout.tsx`
Diferente das outras, envolve o `Stack` num `AuthProvider` próprio (repetição do provider — já existe um em `(auth)`, mas aqui é necessário porque esta aba não descende daquela árvore de componentes).

#### `index.tsx` — Listagem de notificações

**Modelo de dados:**
```ts
interface Notificacao {
  id: string;
  dispositivoId: string;
  ambienteId: string;
  tipo: string;
  nivel: 'aviso' | 'critico';
  mensagem: string;
  sensorTipo: 'temperatura' | 'umidade';
  valorAtual: number;
  limiteMin: number;
  limiteMax: number;
  lida: boolean;
}
```

**Funcionalidade:**
- `fetchNotificacoes()` busca `GET /notificacao/{userId}` (depende do `userId` vindo do `AuthContext`), filtra apenas as **não lidas** (`!n.lida`) e ordena colocando alertas `critico` antes de `aviso`.
- `useFocusEffect` cria um **polling a cada 5 segundos** (`setInterval`) enquanto a tela está em foco, cancelado no cleanup — simula atualização quase em tempo real dos alertas.
- `marcarComoLida`: faz uma **atualização otimista** (remove o item da lista local imediatamente) e só depois chama `POST /notificacao/` com o `notificacaoId`; se der erro, reverte buscando a lista novamente.
- Cada card mostra badge de nível (CRÍTICO em vermelho / AVISO em laranja), tipo de sensor com emoji, a mensagem, e um bloco de "confronto" comparando o valor atual com o limite recomendado. Botão "✓ Marcar como Resolvido" chama `marcarComoLida`.
- Estado vazio: ícone de check verde + "Tudo seguro no armazém".

---

### 4.5 Sub-rota `usuarios/` — Perfil e conta

#### `_layout.tsx`
Também envolve o `Stack` (`index` "Meu Perfil", `cadastro` "Criar Conta") num `AuthProvider` próprio.

#### `index.tsx` — Perfil do usuário logado

**Funcionalidade:**
- `fetchUsuario()` só executa se `userId` for válido (guarda contra `undefined`/`null` string, um detalhe que sugere que o valor pode chegar como string literal `"undefined"` em algum ponto do fluxo de auth). Busca `GET /usuario/{userId}` e preenche `nome`, `email` e `receberEmail` (normalizando o campo, que pode vir como string `"true"`/`"false"` ou booleano).
- Contém vários `console.log` de depuração (emojis 🔄🚀✅❌🏁⚡⏳) acompanhando o ciclo de vida do fetch — útil para estudo de como rastrear problemas de timing entre o Context e a tela, mas seriam candidatos a remoção em produção.
- **Atualizar dados pessoais** (`handleAtualizarDados`): `PATCH /usuario/` com `{ id, nome, email }`.
- **Alternar recebimento de e-mail** (`handleToggleEmail`): atualização otimista do `Switch`; conforme o novo valor, chama `POST /usuario/ativar-recebimento-email` ou `POST /usuario/desativar-recebimento-email`; em erro, reverte o switch e mostra modal.
- **Logout** (`handleLogout`): modal de confirmação → `setUserId(null)` (limpa `AsyncStorage`) → `router.replace('/(auth)')`.
- **Excluir conta** (`handleDeletarConta`/`executarDelecaoConta`): modal de confirmação (`type: 'confirm'`) → `DELETE /usuario/` enviando `{ data: { id: userId } }` no corpo (padrão do Axios para enviar body em requisições DELETE) → em sucesso, `router.replace('/')`.
- FAB leva para `usuarios/cadastro` (permite ao operador logado cadastrar um **novo** usuário/operador, não apenas o próprio perfil).

#### `cadastro.tsx` — Cadastro de novo operador

Formulário simples: nome, e-mail, senha e um `Switch` para `receberEmail`. Valida que os três campos obrigatórios estejam preenchidos, então `POST /usuario/` com o payload completo. Em sucesso, modal de confirmação seguido de `router.back()`.

---

## 5. Padrões recorrentes observados no código

1. **Modal customizado de alerta/confirmação**: em vez de `Alert.alert`, praticamente toda tela implementa seu próprio `Modal` com estado `modalConfig` (`title`, `message`, `type`, `onConfirm`). O `type` (`success` / `warning` / `confirm`) determina cor de ícone e do botão principal — é um padrão copiado e colado em cada arquivo (candidato natural a virar um componente compartilhado, ex. `components/ConfirmModal.tsx`).
2. **`useFocusEffect` + fetch**: todas as listagens recarregam dados ao ganhar foco, útil para refletir mudanças feitas em outras telas (ex.: criar um ambiente e voltar para a lista).
3. **Atualização otimista de UI**: usada em `marcarComoLida` (notificações) e `handleToggleEmail` (perfil) — a UI muda antes da confirmação do servidor, com rollback em caso de erro.
4. **Parâmetros de rota como cache**: ao navegar para uma tela de detalhe/edição, os dados já conhecidos são passados via `params` do `expo-router` em vez de re-buscados, reduzindo chamadas à API.
5. **Tratamento de erro amigável**: respostas HTTP são inspecionadas (`error.response?.status`) para exibir mensagens específicas (ex. `400` no login, `Network Error` para falha de conexão).
6. **Estilo visual consistente**: paleta de cores (indigo `#4F46E5`, slate `#64748B`, vermelho `#EF4444` para crítico, verde `#10B981` para seguro/sucesso) e uso extensivo de `StyleSheet.create` local a cada arquivo — não há tema centralizado.

---

## 6. Endpoints da API consumidos (mapeados a partir do código)

| Método | Rota | Onde é usada |
|---|---|---|
| `POST` | `/autenticacao` | Login |
| `GET` | `/ambiente/` | Listagem de ambientes, listagem/cadastro de dispositivos |
| `POST` | `/ambiente/` | Criar ambiente |
| `PATCH` | `/ambiente/{id}` | Editar ambiente |
| `DELETE` | `/ambiente/{id}` | Excluir ambiente |
| `POST` | `/medicao/buscar-ultima` | Última leitura de temperatura/umidade (lista e detalhe) |
| `POST` | `/medicao/buscar` | Histórico de medições (24h) no detalhe do ambiente |
| `GET` | `/dispositivo/` | Listagem de dispositivos |
| `POST` | `/dispositivo/` | Criar dispositivo |
| `PATCH` | `/dispositivo/{id}` | Editar dispositivo |
| `DELETE` | `/dispositivo/{id}` | Excluir dispositivo |
| `GET` | `/notificacao/{userId}` | Listagem de notificações |
| `POST` | `/notificacao/` | Marcar notificação como lida |
| `GET` | `/usuario/{userId}` | Carregar perfil |
| `PATCH` | `/usuario/` | Atualizar dados do perfil |
| `POST` | `/usuario/ativar-recebimento-email` | Ativar notificações por e-mail |
| `POST` | `/usuario/desativar-recebimento-email` | Desativar notificações por e-mail |
| `DELETE` | `/usuario/` | Excluir conta |
| `POST` | `/usuario/` | Cadastrar novo usuário |

---

## 7. Pontos de atenção para estudo/refatoração

- O modal de confirmação/alerta é duplicado em **7 arquivos** — extrair para um componente único economizaria centenas de linhas e facilitaria manutenção.
- `console.log`s de depuração ficaram em `usuarios/index.tsx` (bom exemplo real de "instrumentação de debug" que passou para o código versionado).
- O `useEffect` de `[id].tsx` que depende de `[tempAtual, umiAtual]` pode gerar re-fetches encadeados — vale observar/testar esse comportamento como exercício de entendimento de dependências de efeito.
- Não há camada de "tipos compartilhados" (`Ambiente`, `Medicao`, `Dispositivo`, `Notificacao` são redefinidos em cada arquivo que precisa deles) — um `src/types` centralizado seria uma melhoria natural.
