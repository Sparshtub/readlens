"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { useAppAuth } from "@/hooks/useAppAuth";
import { Send, Loader2, Bot, User, HelpCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  documentId: string;
  currentPage: number;
}

export default function ChatPanel({ documentId, currentPage }: ChatPanelProps) {
  const { getToken } = useAppAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to the bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load a welcome message when page changes
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Hi there! I am your ReadLens companion. Ask me any question about the text content of **Page ${currentPage}**!`,
        timestamp: new Date()
      }
    ]);
  }, [currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);
    setLoading(true);

    try {
      const token = await getToken();
      const response = await api.chat({
        document_id: documentId,
        page_index: currentPage,
        question: userMessage
      }, token);

      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: response.answer, 
        timestamp: new Date() 
      }]);
    } catch (err) {
      console.error("Chat failed:", err);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Oops! I encountered an error answering your question. Please verify your connection or api key configs.", 
        timestamp: new Date() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    `Summarize page ${currentPage}`,
    `Explain the key concept on this page`,
    `Provide a real-world example of this`
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/40">
      
      {/* Scrollable Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((msg, idx) => {
          const isAI = msg.role === "assistant";
          return (
            <div 
              key={idx} 
              className={`flex gap-3 max-w-[85%] ${isAI ? "mr-auto" : "ml-auto flex-row-reverse"}`}
            >
              {/* Avatar Icon */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs ${
                isAI ? "bg-indigo-600" : "bg-slate-700"
              }`}>
                {isAI ? <Bot size={14} /> : <User size={14} />}
              </div>

              {/* Message Bubble */}
              <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                isAI 
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-800" 
                  : "bg-indigo-600 text-white rounded-tr-none"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <span className={`block text-[9px] mt-1.5 text-right ${
                  isAI ? "text-slate-400" : "text-indigo-200"
                }`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 mr-auto max-w-[85%]">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <Bot size={14} />
            </div>
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Loader2 className="animate-spin text-indigo-500" size={14} />
              <span className="text-xs text-slate-500">Formulating response...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggested Questions Grid (Only show when there is only the welcome message) */}
      {messages.length === 1 && !loading && (
        <div className="px-4 pb-3 space-y-1.5 shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <HelpCircle size={10} /> Suggested Questions
          </p>
          <div className="flex flex-col gap-1.5">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInput(q)}
                className="text-[11px] font-medium text-left px-3 py-2 bg-white hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 rounded-lg transition-colors truncate"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Message Input Form */}
      <form 
        onSubmit={handleSubmit}
        className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Chat with Page ${currentPage}...`}
          disabled={loading}
          className="flex-1 bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-700 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl disabled:opacity-40 transition-colors shrink-0"
        >
          <Send size={15} />
        </button>
      </form>

    </div>
  );
}
