import React, { useEffect, useState, useRef } from 'react';
import Markdown from 'react-markdown';
import {
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  BotMessageSquare,
  Sparkles,
  User,
  GraduationCap,
  RotateCcw,
  MessageSquare,
  ChevronDown,
  Info,
} from 'lucide-react';
import { api } from '../../api/client';
import { AIConversation, AIMessage } from '../../types';

export const AITutorView: React.FC = () => {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [markAllocation, setMarkAllocation] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    { text: 'Explain Dijkstra algorithm with a step-by-step example', marks: 8 },
    { text: 'What is the difference between TCP and UDP?', marks: 4 },
    { text: 'How does virtual memory and paging work in OS?', marks: 8 },
    { text: 'Define normalization and 3NF with a student table example', marks: 8 },
    { text: 'Derive Time Complexity of QuickSort worst vs average case', marks: 4 },
  ];

  const fetchConversations = async () => {
    try {
      const list = await api.getConversations();
      setConversations(list);
      if (list.length > 0 && !currentConversationId) {
        loadConversation(list[0].id);
      } else if (list.length === 0) {
        startNewConversation();
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadConversation = async (id: string) => {
    try {
      setCurrentConversationId(id);
      const conv = await api.getConversation(id);
      setMessages(conv.messages || []);
    } catch (err) {
      console.error('Failed to load conversation', err);
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `👋 Hello! I am your personal **StudyMate AI Academic Tutor**.
I'm here to help you truly understand tough concepts, prepare for university exams, and master technical placement topics.

- Ask me to break down any syllabus concept with analogies.
- Choose a mark allocation (2, 4, 8, 16, or 20 marks) for exam-ready structuring.
- Ask for practice problems, Big-O derivations, or code walkthroughs!`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        startNewConversation();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (textToSend?: string, customMarks?: number) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const currentMarks = customMarks !== undefined ? customMarks : markAllocation;

    const userMessage: AIMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      markAllocation: currentMarks,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.sendMessage({
        conversationId: currentConversationId || undefined,
        message: text,
        markAllocation: currentMarks,
      });

      if (!currentConversationId && res.conversationId) {
        setCurrentConversationId(res.conversationId);
        fetchConversations();
      }

      setMessages((prev) => [...prev, res.message]);
    } catch (err: any) {
      const errorMessage: AIMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error: ${err.message || 'Unable to contact tutor. Please try again.'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.content, lastUserMsg.markAllocation);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* LEFT SIDEBAR: Conversation History */}
      <div className="hidden md:flex w-72 flex-col border-r border-slate-800 bg-slate-950/60 p-4">
        <button
          onClick={startNewConversation}
          className="flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all cursor-pointer mb-4"
        >
          <Plus className="h-4 w-4" />
          <span>New Conversation</span>
        </button>

        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
          Recent Consultations
        </p>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-500 px-2 py-4 italic">No previous chats yet.</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`group flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                  currentConversationId === conv.id
                    ? 'bg-slate-800 text-white font-medium border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-indigo-400" />
                  <span className="truncate">{conv.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  title="Delete chat"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Tutor pedagogical rules chip */}
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 mt-4 text-[11px] text-indigo-300">
          <p className="font-semibold flex items-center gap-1.5 text-white mb-1">
            <GraduationCap className="h-3.5 w-3.5 text-indigo-400" /> Professor Mode Active
          </p>
          <p className="text-slate-400">
            Tuned to encourage active learning, step-by-step reasoning, and exam scoring criteria.
          </p>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TOP CONTROLS: Marks Selector & Mode */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-4 py-2.5 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Exam Mark Format:</span>
            {[
              { label: 'Standard', value: undefined },
              { label: '2 Marks', value: 2 },
              { label: '4 Marks', value: 4 },
              { label: '8 Marks', value: 8 },
              { label: '16 Marks', value: 16 },
            ].map((opt) => {
              const isSelected = markAllocation === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setMarkAllocation(opt.value)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2">
            {messages.length > 2 && (
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
                title="Regenerate last answer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Regenerate</span>
              </button>
            )}
          </div>
        </div>

        {/* MESSAGES LIST */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 max-w-4xl mx-auto ${
                  isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`h-8 w-8 flex-shrink-0 rounded-xl flex items-center justify-center text-xs font-bold ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <BotMessageSquare className="h-4 w-4" />}
                </div>

                {/* Message Body */}
                <div
                  className={`relative group rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white max-w-[85%] sm:max-w-[75%]'
                      : 'border border-slate-800 bg-slate-900/80 text-slate-200 max-w-[90%] sm:max-w-[85%] backdrop-blur-md'
                  }`}
                >
                  {/* Mark pill for user requests */}
                  {msg.markAllocation && (
                    <div className="mb-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/20 text-white">
                        {msg.markAllocation} Marks Format
                      </span>
                    </div>
                  )}

                  {/* Markdown content container */}
                  <div className="markdown-body prose prose-invert prose-xs sm:prose-sm max-w-none text-slate-200">
                    <Markdown>{msg.content}</Markdown>
                  </div>

                  {/* Copy response action */}
                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.model && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {msg.model}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="flex items-center space-x-1 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Notes</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking indicator */}
          {loading && (
            <div className="flex items-start space-x-3 max-w-4xl mx-auto">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                <BotMessageSquare className="h-4 w-4 animate-pulse" />
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md">
                <div className="flex items-center space-x-2 text-xs text-indigo-300">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                  <span>StudyMate AI is analyzing concept and preparing answer...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* SUGGESTED QUESTIONS CHIPS */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/40">
            <p className="text-[11px] font-semibold text-slate-400 mb-2">Suggested practice topics:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q.text, q.marks)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:border-indigo-500 hover:text-white transition-all cursor-pointer text-left"
                >
                  <span>{q.text}</span>
                  <span className="ml-1.5 text-[10px] text-indigo-400 font-semibold font-mono">({q.marks}M)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* INPUT FORM */}
        <div className="border-t border-slate-800 bg-slate-900/80 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="max-w-4xl mx-auto relative flex items-center"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                markAllocation
                  ? `Ask a question (formatting as a ${markAllocation}-mark university exam answer)...`
                  : 'Ask about any theorem, algorithm, code snippet, or exam topic...'
              }
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3.5 pl-4 pr-12 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="absolute right-2.5 rounded-xl bg-indigo-600 p-2 text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
