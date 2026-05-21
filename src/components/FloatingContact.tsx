"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, MessageCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_API = "https://wfthvovlhphnrodrqxqt.supabase.co/functions/v1/chat-storo";
const WELCOME_MESSAGE = "Halo! Saya asisten virtual Storo.id. Ada yang bisa saya bantu seputar pembuatan webstore?";
const WA_URL = "https://wa.me/6285148416700?text=Halo%20Storo.id,%20saya%20mau%20konsultasi%20tentang%20webstore";

const FloatingContact = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Maaf, terjadi gangguan. Silakan hubungi kami langsung via WhatsApp di +62 851-4841-6700." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAIClick = () => {
    setChatOpen(true);
    setMenuOpen(false);
  };

  const handleWAClick = () => {
    window.open(WA_URL, "_blank");
    setMenuOpen(false);
  };

  return (
    <>
      {/* AI Chat Window */}
      {chatOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] max-h-[500px] bg-white rounded-2xl overflow-hidden flex flex-col border border-gray-200"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.18)" }}
        >
          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-white" />
              <div>
                <p className="text-sm font-semibold text-white">Storo.id AI</p>
                <p className="text-[10px] text-white/70">Asisten Virtual</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "340px" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-xl rounded-bl-sm text-sm">
                  <span className="animate-pulse">Mengetik...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan..."
              disabled={loading}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Floating FAB Group */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Sub-menu buttons */}
        <div
          className={`flex flex-col items-end gap-3 transition-all duration-300 ${
            menuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          {/* AI Assistant button */}
          <button
            onClick={handleAIClick}
            className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          >
            <span>AI Assistant</span>
            <span className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </span>
          </button>

          {/* WhatsApp button */}
          <button
            onClick={handleWAClick}
            className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          >
            <span>WhatsApp</span>
            <span className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-white" />
            </span>
          </button>
        </div>

        {/* Main "Hubungi Kami" button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 text-white font-semibold px-5 py-3 rounded-full shadow-xl transition-all duration-200 hover:scale-105"
          style={{
            background: menuOpen
              ? "linear-gradient(135deg, #6366f1, #3b82f6)"
              : "linear-gradient(135deg, #3b82f6, #6366f1)",
          }}
          aria-label="Hubungi Kami"
        >
          {menuOpen ? <X className="w-5 h-5" /> : null}
          <span>{menuOpen ? "Hubungi Kami" : "Hubungi Kami"}</span>
          {!menuOpen && <MessageCircle className="w-5 h-5" />}
        </button>
      </div>
    </>
  );
};

export default FloatingContact;
