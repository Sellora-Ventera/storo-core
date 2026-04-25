"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Headphones } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_API = "https://unpqekghcpjclzvpeyse.supabase.co/functions/v1/chat-storo";
const WELCOME_MESSAGE = "Halo! Saya Storo Assistant, asisten virtual resmi Storo Engine. Ada yang bisa saya bantu seputar platform webstore kami?";
const WA_URL = "https://wa.me/6285148416700?text=Halo%20Storo.id,%20saya%20mau%20konsultasi%20tentang%20webstore";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const FloatingChatbot = () => {
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

  const handleOpenChat = () => {
    setChatOpen(true);
    setMenuOpen(false);
  };

  const handleOpenWA = () => {
    window.open(WA_URL, "_blank");
    setMenuOpen(false);
  };

  return (
    <>
      {/* Chat Window */}
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
                <p className="text-sm font-semibold text-white">Storo Assistant</p>
                <p className="text-[10px] text-white/70">AI Virtual Assistant</p>
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
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
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

      {/* Floating Action Menu */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Expanded Options */}
        {menuOpen && (
          <>
            {/* AI Assistant */}
            <div className="flex items-center gap-3">
              <span className="bg-white text-gray-800 text-sm font-medium px-4 py-2 rounded-full shadow-md whitespace-nowrap">
                AI Assistant
              </span>
              <button
                onClick={handleOpenChat}
                aria-label="Buka AI Assistant"
                className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              >
                <Bot className="w-7 h-7 text-white" />
              </button>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center gap-3">
              <span className="bg-white text-gray-800 text-sm font-medium px-4 py-2 rounded-full shadow-md whitespace-nowrap">
                WhatsApp
              </span>
              <button
                onClick={handleOpenWA}
                aria-label="Chat WhatsApp"
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform text-white"
                style={{ backgroundColor: "#25D366" }}
              >
                <WhatsAppIcon />
              </button>
            </div>
          </>
        )}

        {/* Main CTA Button — Hubungi Kami / Tutup */}
        <button
          onClick={() => {
            setMenuOpen((prev) => !prev);
            if (chatOpen) setChatOpen(false);
          }}
          aria-label={menuOpen ? "Tutup menu" : "Hubungi Kami"}
          className="flex items-center gap-2 px-5 py-3.5 rounded-full shadow-lg hover:scale-105 transition-transform text-white font-semibold text-sm"
          style={{ background: "linear-gradient(135deg, #00bcd4, #2979ff)" }}
        >
          {menuOpen ? (
            <>
              <X className="w-5 h-5" />
              <span>Tutup</span>
            </>
          ) : (
            <>
              <Headphones className="w-5 h-5" />
              <span>Hubungi Kami</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};

export default FloatingChatbot;
