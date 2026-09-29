import { groq } from "@ai-sdk/groq";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

// Modelo único do agente. Default = equivalente oficial ao "qwen/qwen3.8-27b" pedido,
// que não existe na Groq. Override via env GROQ_MODEL.
const MODEL_ID = process.env.GROQ_MODEL || "qwen/qwen3-32b";

function buildSystemPrompt(): string {
  const data_formatada = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `Você é um agente assistente em um programa de detecção de conteúdos falsos (fake news). Interaja com o usuário sugerindo as ferramentas que você tem disponível. Se o usuário perguntar do que se trata, responda 'Sou uma IA disponível para te ajudar a detectar se um conteúdo que circula na internet é verdadeiro ou não, sou capaz de pesquisar na web se o conteúdo é verídico ou não.' Use as ferramentas sempre que possível. A data de hoje é ${data_formatada}. Anexe sempre a fonte da pesquisa na resposta (G1, BBC, New York Times, etc), se houver fonte na pesquisa utilizada. Não invente fontes, não invente dados. Se não houver nada relacionado à pergunta do usuário nas pesquisas, diga que nada foi encontrado. Responda sempre em português do Brasil. Limite-se a 600 caracteres.`;
}

const FOOTER = `Fontes verificadas: G1 Fato ou Fake, CNN Brasil, Globo Política, Record News, Jovem Pan News. Sempre confirme com múltiplas fontes confiáveis.`;

// ---- Tavily ----
type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
  published_date?: string;
};

async function searchTavily(opts: {
  query: string;
  include_domains?: string[];
  exclude_domains?: string[];
  max_results: number;
}) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return { error: "TAVILY_API_KEY não configurada no servidor." };
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: opts.query,
      search_depth: "advanced",
      include_answer: false,
      include_raw_content: false,
      max_results: opts.max_results,
      include_domains: opts.include_domains,
      exclude_domains: opts.exclude_domains,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { error: `Tavily falhou (${res.status}): ${text.slice(0, 500)}` };
  }

  const data = (await res.json()) as {
    results?: TavilyResult[];
    answer?: string;
  };

  // Enxuga payload para o modelo não estourar contexto e respeitar 600 chars
  const results = (data.results || []).slice(0, opts.max_results).map((r) => ({
    title: r.title,
    url: r.url,
    published_date: r.published_date,
    snippet: (r.content || "").slice(0, 600),
  }));

  return { results };
}

const searchQuerySchema = z.object({
  search_query: z
    .string()
    .min(3)
    .describe("Pergunta ou afirmação do usuário a verificar na web"),
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: groq(MODEL_ID),
    system: buildSystemPrompt(),
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    maxOutputTokens: 800,
    temperature: 0.4,
    tools: {
      procura_web_noticias_detectadas_como_fake_news: tool({
        description:
          "Pesquisa em um canal de coleta de Fake News Brasileira (G1 Fato ou Fake)",
        inputSchema: searchQuerySchema,
        execute: async ({ search_query }) =>
          searchTavily({
            query: search_query,
            include_domains: ["g1.globo.com"],
            max_results: 10,
          }),
      }),
      pesquisa_web_global: tool({
        description: "Pesquisa na web de maneira geral",
        inputSchema: searchQuerySchema,
        execute: async ({ search_query }) =>
          searchTavily({
            query: search_query,
            exclude_domains: ["g1.globo.com"],
            max_results: 7,
          }),
      }),
      pesquisa_social_media_verificados: tool({
        description:
          "Pesquisa em portais de notícias verificados (CNN Brasil, Globo, Record, Jovem Pan)",
        inputSchema: searchQuerySchema,
        execute: async ({ search_query }) =>
          searchTavily({
            query: search_query,
            include_domains: [
              "cnnbrasil.com.br",
              "g1.globo.com",
              "r7.com",
              "jovempan.com.br",
            ],
            max_results: 10,
          }),
      }),
    },
  });

  // Adiciona rodapé de fontes ao final (fora do limite do modelo)
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    messageMetadata: () => ({ footer: FOOTER }),
  });
}
