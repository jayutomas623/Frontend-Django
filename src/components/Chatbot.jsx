// C:\laragon\www\Proyecto-Django\frontend\src\components\Chatbot.jsx
// Sprint 4 — Chatbot operacional flotante
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader } from 'lucide-react';
import api from '../api/axios';

// Renderiza el texto markdown-lite del backend (**bold**, bullet •)
function MessageBubble({ text, role }) {
  const isBot = role === 'bot';
  const lines = text.split('\n');

  return (
    <div style={{
      display: 'flex',
      justifyContent: isBot ? 'flex-start' : 'flex-end',
      gap: 8,
      animation: 'msgIn 0.25s ease',
    }}>
      {isBot && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <Bot size={13} color="#f0e4d2" />
        </div>
      )}
      <div style={{
        maxWidth: '82%',
        background: isBot ? 'var(--surface2)' : 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
        color: isBot ? 'var(--text)' : '#f0e4d2',
        padding: '10px 14px',
        borderRadius: isBot ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
        fontSize: 13, lineHeight: 1.6,
        border: isBot ? '1px solid var(--border)' : 'none',
      }}>
        {lines.map((line, i) => {
          // Bold: **texto**
          const parts = line.split(/\*\*(.*?)\*\*/g);
          const rendered = parts.map((p, j) =>
            j % 2 === 1 ? <strong key={j} style={{ color: isBot ? 'var(--accent-light)' : '#ffe4c4' }}>{p}</strong> : p
          );
          // Cursiva: _texto_
          const italic = rendered.flatMap((el, j) => {
            if (typeof el !== 'string') return [el];
            const ps = el.split(/_(.*?)_/g);
            return ps.map((p2, k) => k % 2 === 1 ? <em key={`${j}-${k}`}>{p2}</em> : p2);
          });
          return (
            <p key={i} style={{ margin: line.startsWith('  •') ? '2px 0 2px 8px' : (i > 0 ? '4px 0 0' : 0) }}>
              {italic}
            </p>
          );
        })}
      </div>
      {!isBot && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <User size={13} color="var(--text-muted)" />
        </div>
      )}
    </div>
  );
}

const SUGERENCIAS = [
  '¿Cuánto vendimos hoy?',
  '¿Pedidos activos ahora?',
  '¿Cuáles son los más vendidos?',
  '¿Hay stock crítico?',
];

export default function Chatbot() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: '👋 Hola! Soy el asistente de Kusillu.\nPuedo darte información operacional en tiempo real. ¿En qué te ayudo?' }
  ]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [unread,   setUnread]   = useState(0);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) { setUnread(0); inputRef.current?.focus(); }
  }, [open]);

  const sendMessage = async (texto = input.trim()) => {
    if (!texto || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: texto }]);
    setLoading(true);
    try {
      const res = await api.post('/recommendations/chatbot/', { mensaje: texto });
      setMessages(prev => [...prev, { role: 'bot', text: res.data.respuesta }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Error al conectar con el servidor.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Panel del chat */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 9000,
          width: 360, height: 480,
          background: 'var(--bg)',
          border: '1px solid var(--border-hi)',
          borderRadius: 18,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 16px 56px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          animation: 'chatOpen 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Bot size={18} color="#f0e4d2" />
              <div>
                <p style={{ color: '#f0e4d2', fontWeight: 700, fontSize: 14 }}>Asistente Kusillu</p>
                <p style={{ color: 'rgba(240,228,210,0.65)', fontSize: 11 }}>Datos en tiempo real</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#f0e4d2', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}>
              <X size={15} />
            </button>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => (
              <MessageBubble key={i} text={m.text} role={m.role} />
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={13} color="#f0e4d2" />
                </div>
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '4px 12px 12px 12px', display: 'flex', gap: 5 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} style={{ height: 8 }} />
          </div>

          {/* Sugerencias rápidas */}
          {messages.length <= 2 && (
            <div style={{ padding: '8px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SUGERENCIAS.map(s => (
                <button key={s} onClick={() => sendMessage(s)} style={{ padding: '5px 10px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-light)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Escribe tu consulta..."
              disabled={loading}
              style={{ flex: 1, padding: '9px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{ width: 38, height: 38, borderRadius: 9, border: 'none', background: input.trim() ? 'var(--accent)' : 'var(--surface3)', color: '#f0e4d2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.2s', flexShrink: 0 }}
            >
              {loading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9001,
          width: 54, height: 54, borderRadius: '50%',
          background: open
            ? 'var(--surface3)'
            : 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
          border: 'none', color: '#f0e4d2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: open ? 'none' : '0 6px 24px rgba(207,100,48,0.45)',
          transition: 'all 0.25s',
        }}
        title="Asistente Kusillu"
      >
        {open ? <X size={20} /> : <MessageSquare size={21} />}
        {!open && unread > 0 && (
          <div style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: 'var(--danger)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unread}
          </div>
        )}
      </button>

      <style>{`
        @keyframes chatOpen {
          from { opacity: 0; transform: scale(0.85) translateY(20px); transform-origin: bottom right; }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40%           { transform: scale(1.2); opacity: 1;   }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}