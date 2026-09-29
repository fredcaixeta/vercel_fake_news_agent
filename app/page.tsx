"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const EXAMPLES = [
  "Vi no WhatsApp que o governo vai confiscar a poupança",
  "O Trump disse que vai comprar o Brasil mesmo?",
  "A vacina causa infertilidade segundo estudos recentes?",
  "O dólar vai acabar em breve no Brasil",
];

const SOURCES = [
  { name: "G1 Fato ou Fake", url: "https://g1.globo.com/fato-ou-fake/" },
  { name: "CNN Brasil", url: "https://www.cnnbrasil.com.br/" },
  { name: "Globo Política", url: "https://g1.globo.com/politica/" },
  { name: "Record News", url: "https://recordnews.r7.com/" },
  { name: "Jovem Pan News", url: "https://jovempan.com.br/" },
];

function getText(message: { parts?: unknown; content?: unknown }): string {
  const m = message as {
    parts?: Array<{ type: string; text?: string }>;
    content?: string;
  };
  if (Array.isArray(m.parts)) {
    return m.parts
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text as string)
      .join("");
  }
  return typeof m.content === "string" ? m.content : "";
}

export default function Page() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const isLoading = status === "streaming" || status === "submitted";

  const send = (text: string) => {
    const value = text.trim();
    if (!value || isLoading) return;
    sendMessage({ text: value });
    setInput("");
  };

  return (
    <div className="container">
      <div className="header">
        <div className="badge">Groq • qwen/qwen3-32b • Tavily</div>
        <h1>Detector de Fake News</h1>
        <p>
          Sou uma IA disponível para te ajudar a detectar se um conteúdo que
          circula na internet é verdadeiro ou não. Sou capaz de pesquisar na
          web se o conteúdo é verídico ou não. Cole a mensagem que você
          recebeu e eu verifico para você.
        </p>
      </div>

      <div className="chat">
        <div className="status">
          {isLoading ? (
            <span className="tool-status">
              ● pesquisando na web (G1 Fato ou Fake, CNN, Globo, Record, Jovem
              Pan)…
            </span>
          ) : (
            <span>
              {messages.length === 0
                ? "Pronto para verificar • responde em pt-BR, máx. 600 caracteres + fontes"
                : `${messages.length} mensagens`}
            </span>
          )}
        </div>

        <div className="messages">
          {messages.length === 0 && (
            <div className="empty">
              Experimente um exemplo abaixo 👇
              <br />
              Ex.: “Vi no WhatsApp que o governo vai confiscar a poupança”
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`msg ${m.role === "user" ? "user" : "assistant"}`}
            >
              {getText(m) || "…"}
            </div>
          ))}
        </div>

        <div className="examples">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              className="example-btn"
              disabled={isLoading}
              onClick={() => send(ex)}
            >
              {ex}
            </button>
          ))}
        </div>

        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            className="input"
            placeholder="Cole aqui o boato, link ou afirmação…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button className="button" type="submit" disabled={isLoading}>
            {isLoading ? "…" : "Verificar"}
          </button>
        </form>
      </div>

      <footer className="sources-card">
        <div className="sources-head">
          <span className="sources-title">✅ Fontes verificadas</span>
          <span className="sources-sub">
            Base da checagem do agente
          </span>
        </div>

        <div className="sources-grid">
          {SOURCES.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="source-pill"
            >
              {s.name}
            </a>
          ))}
        </div>

        <div className="sources-warn">
          ⚠️ Sempre confirme com múltiplas fontes confiáveis.
        </div>
      </footer>
    </div>
  );
}
