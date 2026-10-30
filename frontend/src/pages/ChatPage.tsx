import React, { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown, Clock, Sparkles, RefreshCw, AlertCircle, Bot, User as UserIcon } from 'lucide-react';
import { apiClient } from '../api/client';
import type { ChatMessage, ChatResponsePayload, RateResponsePayload, RatingType } from '../api/types';
import { VerdictBadge } from '../components/VerdictBadge';
import { CategoryBadge } from '../components/CategoryBadge';

const SUGGESTED_PROMPTS = [
  { text: "How can I enroll in a course?", label: "Enrollment (Answered)" },
  { text: "How do I verify my certificate authenticity?", label: "Certificates (Answered)" },
  { text: "Does ArchintX offer career coaching or mentorship?", label: "Jobs (Answered)" },
  { text: "How do I reset my account password?", label: "Account (Answered)" },
  { text: "Tell me about your programs.", label: "Ambiguous Query (Unclear)" },
  { text: "What is the capital of Japan?", label: "Unrelated Query (Refused)" },
];

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am Arc Lite, ArchintX's verified AI FAQ assistant. I provide instant, hallucination-free answers about our Courses, Certificates, Jobs, and Account services. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [ratingLoadingId, setRatingLoadingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const question = (textToSend !== undefined ? textToSend : inputQuestion).trim();

    if (!question) {
      setErrorMsg('Please enter a question before sending.');
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }

    setErrorMsg(null);
    setInputQuestion('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await apiClient.post<ChatResponsePayload>('/chat', {
        question: question,
      });

      const resData = response.data;

      const assistantMessage: ChatMessage = {
        id: `assistant-${resData.conversation_id}`,
        sender: 'assistant',
        text: resData.answer,
        category: resData.category,
        verdict: resData.verdict,
        responseTimeMs: resData.response_time_ms,
        conversationId: resData.conversation_id,
        rating: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorChatMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: err.response?.data?.detail || 'Unable to connect to the Arc Lite knowledge engine. Please ensure the backend is running.',
        verdict: 'Refused',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorChatMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (conversationId: number, rating: RatingType) => {
    setRatingLoadingId(conversationId);
    try {
      await apiClient.post<RateResponsePayload>(`/chat/${conversationId}/rate`, {
        rating,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.conversationId === conversationId
            ? { ...m, rating: m.rating === rating ? null : rating }
            : m
        )
      );
    } catch (err) {
      console.error('Rating submission failed:', err);
    } finally {
      setRatingLoadingId(null);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: "Session cleared. I am ready to answer verified questions about Courses, Certificates, Jobs, or Account management.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4.5rem)]">
      {/* Category Pills Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-300">Verified Knowledge Base Categories:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Courses
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Certificates
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
            Jobs
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
            Account
          </span>
          <button
            onClick={clearChat}
            title="Reset conversation"
            className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scroll-smooth">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold border ${
                msg.sender === 'user'
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {msg.sender === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>

            {/* Bubble Container */}
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 border shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-slate-800 text-slate-100 border-slate-700/80 rounded-tr-sm'
                  : 'bg-slate-900/90 text-slate-200 border-slate-800 rounded-tl-sm'
              }`}
            >
              {/* Message Header Badges (Assistant only) */}
              {msg.sender === 'assistant' && (msg.verdict || msg.category || msg.responseTimeMs) && (
                <div className="flex flex-wrap items-center gap-2 mb-2 pb-2 border-b border-slate-800/80">
                  {msg.verdict && <VerdictBadge verdict={msg.verdict} size="sm" />}
                  {msg.category && <CategoryBadge category={msg.category} size="sm" />}
                  {msg.responseTimeMs !== undefined && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800">
                      <Clock size={11} className="text-slate-400" />
                      {msg.responseTimeMs} ms
                    </span>
                  )}
                </div>
              )}

              {/* Message Text */}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

              {/* Footer: Timestamp and Feedback Buttons */}
              <div className="mt-2.5 pt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>{msg.timestamp}</span>

                {msg.sender === 'assistant' && msg.conversationId && (
                  <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800">
                    <button
                      onClick={() => handleRate(msg.conversationId!, 'up')}
                      disabled={ratingLoadingId === msg.conversationId}
                      title="Helpful answer"
                      className={`p-1.5 rounded transition-all duration-150 ${
                        msg.rating === 'up'
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsUp size={12} />
                    </button>
                    <button
                      onClick={() => handleRate(msg.conversationId!, 'down')}
                      disabled={ratingLoadingId === msg.conversationId}
                      title="Unhelpful or inaccurate answer"
                      className={`p-1.5 rounded transition-all duration-150 ${
                        msg.rating === 'down'
                          ? 'bg-rose-500 text-white font-bold'
                          : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsDown size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Bot size={16} />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-slate-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Analyzing query with TF-IDF cosine similarity...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="mt-3 pt-2">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
          Try a prompt:
        </p>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SUGGESTED_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.text)}
              disabled={loading}
              className="text-xs shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
            >
              <span className="font-medium">{p.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Box and Validation Error */}
      <div className="mt-2 relative">
        {errorMsg && (
          <div className="absolute -top-9 left-0 right-0 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1 rounded-lg text-xs animate-in fade-in slide-in-from-bottom-1">
            <AlertCircle size={13} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-2 focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/40 transition-all shadow-lg"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask about courses, certificates, jobs, or account settings..."
            disabled={loading}
            className="flex-1 bg-transparent px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !inputQuestion.trim()}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
          >
            <span>Send</span>
            <Send size={13} />
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-1.5">
          Arc Lite guarantees verified answers only. Out-of-scope queries are strictly refused to prevent hallucinations.
        </p>
      </div>
    </div>
  );
};
