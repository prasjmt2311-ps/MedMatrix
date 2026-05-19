import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Sparkles, Trash2, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const suggestions = {
  user: [
    'What are symptoms of high blood pressure?',
    'How do I prepare for a blood test?',
    'What is a normal blood sugar level?',
    'How to book a telemedicine appointment?',
  ],
  hospital: [
    'How to manage ICU bed allocation efficiently?',
    'What is the protocol for mass casualty events?',
    'Guidelines for patient transfer documentation?',
    'How to reduce hospital readmission rates?',
  ],
};

export default function AIAssistant() {
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: role === 'hospital'
        ? "Hello! I'm UnityCure AI, your hospital management assistant. Ask me anything about patient care, resources, or operations."
        : "Hello! I'm UnityCure AI, your personal health assistant. Ask me anything about your health, symptoms, or how to use UnityCure.",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const history = messages.slice(-6);
      const { data } = await api.post('/ai/chat', {
        message: userMsg,
        role: role || 'user',
        history,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message || '';
      const userMsg = serverMsg.includes('rate-limited') || serverMsg.includes('Rate limit')
        ? 'The AI service is temporarily rate-limited. Please wait a moment and try again.'
        : 'Sorry, I encountered an error. ' + (serverMsg || 'Please check your Gemini API key in the server .env file.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: userMsg,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: role === 'hospital'
        ? "Chat cleared. How can I help you with hospital operations?"
        : "Chat cleared. How can I help you with your health today?",
    }]);
  };

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-violet-500 text-white shadow-2xl flex items-center justify-center"
        style={{ boxShadow: '0 8px 32px rgba(0,212,170,0.35)' }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X size={22} />
              </motion.div>
            : <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Sparkles size={22} />
              </motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] flex flex-col"
            style={{ height: '520px' }}
          >
            <div className="flex flex-col h-full bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-teal-500/10 to-violet-500/10 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">UnityCure AI</div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                      <span className="text-xs text-slate-400">Powered by OpenAI</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTranslator(true)}
                    className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-teal-400 hover:bg-white/10 transition-all"
                    title="Translate medical report"
                  >
                    <FileText size={15} />
                  </button>
                  <button
                    onClick={clearChat}
                    className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-red-400 hover:bg-white/10 transition-all"
                    title="Clear chat"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={'flex gap-2.5 ' + (msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                  >
                    <div className={'w-7 h-7 rounded-xl shrink-0 flex items-center justify-center ' +
                      (msg.role === 'user'
                        ? 'bg-teal-500/20 border border-teal-500/30'
                        : 'bg-violet-500/20 border border-violet-500/30'
                      )}
                    >
                      {msg.role === 'user'
                        ? <User size={13} className="text-teal-400" />
                        : <Bot size={13} className="text-violet-400" />
                      }
                    </div>
                    <div
                      className={'max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ' +
                        (msg.role === 'user'
                          ? 'bg-teal-500/15 border border-teal-500/20 text-white rounded-tr-sm'
                          : 'bg-white/5 border border-white/8 text-slate-300 rounded-tl-sm'
                        )}
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                  </motion.div>
                ))}

                {/* Loading Indicator */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                      <Bot size={13} className="text-violet-400" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/5 border border-white/8 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Suggestions — only show at start */}
              {messages.length === 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {suggestions[role || 'user'].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-teal-400 hover:border-teal-500/30 transition-all text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-4 pb-4 pt-2 border-t border-white/5">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 transition-colors"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-teal-400 text-slate-900 hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <div className="text-center text-xs text-slate-700 mt-2">
                  AI responses are for guidance only. Consult a doctor for medical decisions.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Translator Modal */}
      <AnimatePresence>
        {showTranslator && (
          <ReportTranslatorModal onClose={() => setShowTranslator(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Report Translator Modal (inline) ─── */
function ReportTranslatorModal({ onClose }) {
  const [text, setText] = useState('');
  const [translated, setTranslated] = useState('');
  const [summary, setSummary] = useState('');
  const [direction, setDirection] = useState('en-hi');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('translate');

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setTranslated('');
    try {
      const { data } = await api.post('/ai/translate', { text, direction });
      setTranslated(data.translated);
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message || '';
      setTranslated(
        serverMsg.includes('rate-limited') || serverMsg.includes('Rate limit')
          ? 'Rate limit reached. Please wait a moment and try again.'
          : 'Translation failed. ' + (serverMsg || 'Please check your API key.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setSummary('');
    try {
      const { data } = await api.post('/ai/summarize', { text });
      setSummary(data.summary);
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message || '';
      setSummary(
        serverMsg.includes('rate-limited') || serverMsg.includes('Rate limit')
          ? 'Rate limit reached. Please wait a moment and try again.'
          : 'Summarization failed. ' + (serverMsg || 'Please check your API key.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div>
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>
              Medical Report Assistant
            </h2>
            <p className="text-slate-400 text-sm">Translate or summarize medical reports instantly</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Tabs */}
          <div className="flex gap-2">
            {['translate', 'summarize'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={'px-4 py-2 rounded-xl text-sm capitalize transition-all ' +
                  (tab === t
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                  )}
              >
                {t === 'translate' ? '🌐 Translate' : '📋 Summarize'}
              </button>
            ))}
          </div>

          {/* Direction toggle — only for translate */}
          {tab === 'translate' && (
            <div className="flex gap-2">
              <button
                onClick={() => setDirection('en-hi')}
                className={'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ' +
                  (direction === 'en-hi'
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                  )}
              >
                🇬🇧 English → हिन्दी 🇮🇳
              </button>
              <button
                onClick={() => setDirection('hi-en')}
                className={'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ' +
                  (direction === 'hi-en'
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                  )}
              >
                🇮🇳 हिन्दी → English 🇬🇧
              </button>
            </div>
          )}

          {/* Input */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">
              {tab === 'translate' ? 'Report Text' : 'Medical Report / Notes'}
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              placeholder={tab === 'translate'
                ? (direction === 'en-hi'
                    ? 'Paste English medical report here...'
                    : 'यहाँ हिन्दी मेडिकल रिपोर्ट पेस्ट करें...')
                : 'Paste your medical report or doctor notes here...'
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 resize-none"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={tab === 'translate' ? handleTranslate : handleSummarize}
            disabled={!text.trim() || loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              : tab === 'translate' ? '🌐 Translate Report' : '📋 Summarize Report'
            }
          </button>

          {/* Output */}
          {(translated || summary) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/3 border border-white/8 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-teal-400 font-semibold uppercase tracking-wider">
                  {tab === 'translate' ? 'Translation' : 'Summary'}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(translated || summary)}
                  className="text-xs text-slate-500 hover:text-teal-400 transition-colors"
                >
                  Copy
                </button>
              </div>
              <div
                className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: (translated || summary)
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                    .replace(/\n/g, '<br/>')
                }}
              />
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}