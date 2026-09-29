# Detector de Fake News — Chatbot (Vercel + Groq + Tavily)

Chatbot simples, UI limpa, com **agente único** na Groq e 3 tools de pesquisa via **Tavily**.

> ⚠️ Você pediu `qwen/qwen3.8-27b`, que **não existe na Groq**. O app usa o equivalente oficial estável **`qwen/qwen3-32b`** (configurável via `GROQ_MODEL`). Se a Groq lançar o 3.8-27b, basta trocar a env.

## 1. Rodar local

```bash
npm install
cp .env.example .env.local
# preencha GROQ_API_KEY e TAVILY_API_KEY
npm run dev
```

Acesse http://localhost:3000

## 2. Deploy na Vercel

1. Suba para o GitHub:
```bash
git add -A
git commit -m "feat: chatbot fake news (groq + tavily)"
git push
```
2. Em https://vercel.com/new → Importe o repo → Framework: **Next.js** (auto).
3. Em Settings → Environment Variables, adicione:
   - `GROQ_API_KEY` = `gsk_...` (https://console.groq.com/keys)
   - `TAVILY_API_KEY` = `tvly-...` (https://tavily.com/)
   - `GROQ_MODEL` = `qwen/qwen3-32b`
4. Deploy. Pronto — cada push gera novo deploy.

## 3. Como funciona

- `app/api/chat/route.ts` = agente único:
  - system prompt (pt-BR, 600 caracteres, cita fontes, não inventa dados, data de hoje dinâmica)
  - tools (Tavily):
    - `procura_web_noticias_detectadas_como_fake_news` → `include_domains: [g1.globo.com]`
    - `pesquisa_web_global` → `exclude_domains: [g1.globo.com]`
    - `pesquisa_social_media_verificados` → `include_domains: [cnnbrasil.com.br, g1.globo.com, r7.com, jovempan.com.br]`
  - Nota: a API do Tavily aceita **domínios** (`g1.globo.com`), não URLs de X/Twitter nem paths. Por isso adaptei sua lista original de `x.com/...` para os portais correspondentes — o comportamento (checar mídia verificada) é mantido.
- `app/page.tsx` = UI limpa com os 4 exemplos que você passou + rodapé fixo de fontes verificadas.

## 4. Estrutura

```
app/
  layout.tsx
  page.tsx          # UI chat
  globals.css
  api/chat/route.ts # agente Groq + tools Tavily
.env.example
package.json
next.config.mjs
```
