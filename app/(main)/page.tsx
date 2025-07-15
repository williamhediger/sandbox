"use client";
import { useState, useRef, useEffect } from "react";

type Message = {
  sender: "user" | "bot";
  text: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleAsk = async () => {
    if (!question.trim()) return;
    const newMessages: Message[] = [...messages, { sender: "user", text: question }];
    setMessages(newMessages);
    setQuestion("");
    setLoading(true);

    const res = await fetch("/api/ask", {
      method: "POST",
      body: JSON.stringify({ question }),
    });

    const data = await res.json();
    setMessages((prev) => [...prev, { sender: "bot", text: data.answer }]);
    setLoading(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-[#f4f4f5] dark:bg-[#1a1a1a]">
      <header className="p-4 shadow-md bg-white dark:bg-black text-xl font-semibold text-gray-800 dark:text-white">
        Policy Assistant
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-xl px-4 py-2 rounded-lg text-white ${
              msg.sender === "user" ? "bg-blue-600 ml-auto" : "bg-gray-700 mr-auto"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </main>

      <footer className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-black">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-black"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
          />
          <button
            onClick={handleAsk}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Ask"}
          </button>
        </div>
      </footer>
    </div>
  );
}
