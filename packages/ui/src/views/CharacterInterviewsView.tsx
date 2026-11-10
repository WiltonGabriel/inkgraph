import { useState } from "react";
import { Send, User, Bot } from "lucide-react";
import type { LoreItem } from "../data/mockData";

interface Props {
  lore: LoreItem[];
}

interface Message {
  role: "author" | "character";
  text: string;
}

export const CharacterInterviewsView: React.FC<Props> = ({ lore }) => {
  const characters = lore.filter((i) => i.type === "character");
  const [selectedId, setSelectedId] = useState<string>(characters[0]?.id || "");
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    char_vance: [
      {
        role: "author",
        text: "Elias, o que você sentiu no momento em que ordenou a quebra do selo do Portão Cinzento?",
      },
      {
        role: "character",
        text: "O aço não sente frio, autor. Mas os dedos tremem quando você sabe que a ordem que sai da sua boca vai condenar trezentos homens para salvar um único garoto assustado. Eu faria de novo. Mas não me peça para chamar isso de honra.",
      },
    ],
  });

  const [inputText, setInputText] = useState("");
  const selectedChar = characters.find((c) => c.id === selectedId) || characters[0];

  const currentChat = (selectedChar && messages[selectedChar.id]) || [];

  const handleSend = () => {
    if (!inputText.trim() || !selectedChar) return;

    const newAuthorMsg: Message = { role: "author", text: inputText.trim() };
    const updated = [...currentChat, newAuthorMsg];

    setMessages((prev) => ({
      ...prev,
      [selectedChar.id]: updated,
    }));

    setInputText("");

    // Simulated character response grounded in epistemic state and psychology
    setTimeout(() => {
      let reply = `Como ${selectedChar.name}, respondo com base nas minhas convicções: ${selectedChar.summary}`;
      if (selectedChar.id === "char_vance") {
        reply = "Você faz perguntas demais sobre o passado. As patrulhas da Ordem estão a três milhas ao sul; se você quer respostas, me ajude a encontrar abrigo antes da nevasca.";
      } else if (selectedChar.id === "char_morrigan") {
        reply = "Toda pergunta tem um preço, meu caro. Você me oferece palavras; eu exijo lealdade e silêncio sobre o que viu nas catacumbas.";
      }

      setMessages((prev) => ({
        ...prev,
        [selectedChar.id]: [...(prev[selectedChar.id] || []), { role: "character", text: reply }],
      }));
    }, 600);
  };

  const sampleQuestions = [
    "Qual é o seu maior medo inconfessável?",
    "Por que você não confia na Rainha Morrigan?",
    "O que realmente aconteceu no Cerco de Vael?",
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "1rem", height: "100%" }}>
      {/* Character Selector */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "0.8rem 1rem", borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Entrevistas Psicológicas</span>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Sabatina para encontrar a voz do personagem
          </p>
        </div>

        <div style={{ padding: "0.5rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {characters.map((char) => {
            const isSelected = char.id === selectedId;
            return (
              <div
                key={char.id}
                onClick={() => setSelectedId(char.id)}
                style={{
                  padding: "0.6rem 0.8rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: isSelected ? "var(--bg-card)" : "transparent",
                  border: isSelected ? "1px solid var(--accent)" : "1px solid transparent",
                }}
              >
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: isSelected ? "#fff" : "#cbd5e1" }}>
                  {char.name}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  {char.subtype || "Personagem"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChar ? (
        <div
          style={{
            background: "var(--bg-secondary)",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{ padding: "0.8rem 1.2rem", borderBottom: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>
                Entrevista em Primeira Pessoa
              </span>
              <h3 style={{ fontSize: "1.1rem", marginTop: "0.1rem" }}>{selectedChar.name}</h3>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Voz calibrada via dossiê psicológico
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: "1.2rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {currentChat.map((msg, idx) => {
              const isAuthor = msg.role === "author";
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: isAuthor ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "75%",
                      background: isAuthor ? "var(--accent)" : "var(--bg-card)",
                      color: isAuthor ? "#fff" : "#cbd5e1",
                      padding: "0.8rem 1rem",
                      borderRadius: "8px",
                      border: isAuthor ? "none" : "1px solid var(--border)",
                      fontSize: "0.85rem",
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", marginBottom: "0.3rem", opacity: 0.8 }}>
                      {isAuthor ? <User size={12} /> : <Bot size={12} />}
                      <strong>{isAuthor ? "Você (Autor)" : selectedChar.name}</strong>
                    </div>
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Questions Helper */}
          <div style={{ padding: "0.5rem 1.2rem", background: "var(--bg-primary)", borderTop: "1px solid var(--border)", display: "flex", gap: "0.4rem", overflowX: "auto" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", alignSelf: "center", whiteSpace: "nowrap" }}>
              Perguntas rápidas:
            </span>
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(q)}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.7rem",
                  color: "#cbd5e1",
                  whiteSpace: "nowrap",
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div style={{ padding: "0.8rem 1.2rem", borderTop: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", gap: "0.6rem" }}>
            <input
              type="text"
              placeholder={`Interrogue ${selectedChar.name} para testar diálogos e motivação...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              style={{
                flex: 1,
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "0.5rem 0.8rem",
                fontSize: "0.85rem",
                outline: "none",
                color: "#fff",
              }}
            />
            <button
              onClick={handleSend}
              style={{
                background: "var(--accent)",
                color: "#fff",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Send size={14} /> Perguntar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
