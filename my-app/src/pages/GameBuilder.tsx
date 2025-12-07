import { useState, useRef } from "react";
import { Button, TextField, Paper, Chip } from "@mui/material";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function GameBuilder() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const templates = [
    "Make the dino jump higher",
    "Change dino color to blue",
    "Make obstacles move faster",
    "Add double jump ability",
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMessage = { role: "user" as const, content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/.netlify/functions/game-chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message || "Done! Check your game!",
        },
      ]);

      if (data.gameModified) {
        iframeRef.current?.contentWindow?.location.reload();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Oops! Something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 100px)", gap: "10px", padding: "10px" }}>
      <div style={{ width: "400px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <h2>🤖 AI Game Builder</h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {templates.map((t, i) => (
            <Chip
              key={i}
              label={t}
              onClick={() => sendMessage(t)}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
        </div>

        <Paper
          style={{
            flex: 1,
            padding: "10px",
            overflowY: "auto",
            background: "#f5f5f5",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: "10px",
                padding: "10px",
                borderRadius: "8px",
                background: msg.role === "user" ? "#1976d2" : "white",
                color: msg.role === "user" ? "white" : "black",
                marginLeft: msg.role === "user" ? "20px" : "0",
                marginRight: msg.role === "assistant" ? "20px" : "0",
              }}
            >
              <strong>{msg.role === "user" ? "You" : "AI"}:</strong>
              <div>{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ textAlign: "center", color: "#666" }}>
              AI is thinking...
            </div>
          )}
        </Paper>

        <div style={{ display: "flex", gap: "10px" }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Tell AI what to change..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) {
                sendMessage(input);
              }
            }}
          />
          <Button
            variant="contained"
            onClick={() => sendMessage(input)}
            disabled={loading || !input}
          >
            Send
          </Button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <h2>🎮 Your Game (Press SPACE to jump!)</h2>
        <iframe
          ref={iframeRef}
          src="/dino-game.html"
          style={{
            flex: 1,
            border: "2px solid #333",
            borderRadius: "8px",
          }}
        />
      </div>
    </div>
  );
}

export default GameBuilder;

