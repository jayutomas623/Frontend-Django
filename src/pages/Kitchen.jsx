import { useEffect, useState } from 'react';
import { ChefHat, Clock, CheckCircle, RefreshCw, Flame } from 'lucide-react';
import api from '../api/axios';

const ESTADO_STYLE = {
  confirmado: {
    cardBorder: 'rgba(224,168,48,0.3)',
    cardBg: 'rgba(224,168,48,0.04)',
    badgeColor: 'var(--gold)',
    badgeBg: 'rgba(224,168,48,0.12)',
    badgeBorder: 'rgba(224,168,48,0.25)',
    label: 'Nuevo',
    dot: 'var(--gold)',
  },
  en_preparacion: {
    cardBorder: 'rgba(207,100,48,0.3)',
    cardBg: 'rgba(207,100,48,0.05)',
    badgeColor: 'var(--accent-light)',
    badgeBg: 'rgba(207,100,48,0.12)',
    badgeBorder: 'rgba(207,100,48,0.25)',
    label: 'En preparación',
    dot: 'var(--accent)',
  },
};

export default function Kitchen() {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const r = await api.get('/orders/kitchen/');
      setOrders(r.data);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 15000);
    return () => clearInterval(iv);
  }, []);

  const markReady = async (id) => {
    await api.patch(`/orders/kitchen/${id}/ready/`);
    fetchOrders();
  };

  const nuevos  = orders.filter(o => o.estado === 'confirmado').length;
  const enPrep  = orders.filter(o => o.estado === 'en_preparacion').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(12,8,6,0.93)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 62,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, var(--accent), var(--gold))',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ChefHat size={19} color="var(--accent)" />
          <h2 style={{
            fontSize: 22, color: 'var(--text)',
            fontFamily: 'Cormorant Garamond, serif',
          }}>
            Panel Cocina
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Act: {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchOrders} disabled={loading}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', padding: '7px 11px', borderRadius: 8,
              display: 'flex', alignItems: 'center',
            }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 28px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Nuevos',          value: nuevos, color: 'var(--gold)',    icon: '🔔', bg: 'rgba(224,168,48,0.08)'  },
            { label: 'En preparación',  value: enPrep, color: 'var(--accent-light)', icon: '🔥', bg: 'rgba(207,100,48,0.08)'  },
            { label: 'Total activos',   value: orders.length, color: 'var(--text)', icon: '📋', bg: 'var(--surface2)' },
          ].map(({ label, value, color, icon, bg }) => (
            <div key={label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                {icon}
              </div>
              <div>
                <p style={{
                  fontSize: 28, fontWeight: 700, color,
                  fontFamily: 'Cormorant Garamond, serif', lineHeight: 1,
                }}>
                  {value}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Empty */}
        {orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.25 }}>🍳</div>
            <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>Sin pedidos pendientes</p>
            <p style={{ fontSize: 13, marginTop: 5, color: 'var(--text-dim)' }}>
              Los nuevos pedidos aparecerán aquí automáticamente
            </p>
          </div>
        )}

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(265px, 1fr))',
          gap: 14,
        }}>
          {orders.map((o, index) => {
            const s = ESTADO_STYLE[o.estado] || ESTADO_STYLE.confirmado;
            return (
              <div key={o.id} style={{
                background: 'var(--surface)',
                border: `1px solid ${s.cardBorder}`,
                borderRadius: 13, overflow: 'hidden',
                animation: `fadeUp 0.3s ease ${index * 0.05}s both`,
                transition: 'box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Card header */}
                <div style={{
                  background: s.cardBg, padding: '12px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: `1px solid ${s.cardBorder}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', background: s.dot,
                      animation: 'pulse 2s infinite',
                    }} />
                    <span style={{
                      fontWeight: 700, fontSize: 14,
                      fontFamily: 'Jost, monospace', letterSpacing: 1,
                      color: 'var(--text)',
                    }}>
                      #{o.codigo?.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: s.badgeColor,
                    background: s.badgeBg, border: `1px solid ${s.badgeBorder}`,
                    padding: '3px 10px', borderRadius: 20,
                    letterSpacing: '0.03em',
                  }}>
                    {s.label}
                  </span>
                </div>

                {/* Items */}
                <div style={{ padding: '13px 15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                    <Clock size={12} color="var(--text-dim)" />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(o.creado_en).toLocaleTimeString()}
                    </span>
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {o.items.map((i, idx) => (
                      <li key={idx} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontSize: 13, padding: '7px 11px',
                        background: 'var(--surface2)', borderRadius: 7,
                        color: 'var(--text)',
                      }}>
                        <span>{i.producto_nombre}</span>
                        <span style={{
                          fontWeight: 700, color: 'var(--accent-light)', fontSize: 13,
                          background: 'rgba(207,100,48,0.1)', padding: '1px 8px', borderRadius: 5,
                        }}>
                          ×{i.cantidad}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action */}
                {o.estado === 'en_preparacion' && (
                  <div style={{ padding: '0 15px 14px' }}>
                    <button onClick={() => markReady(o.id)} style={{
                      width: '100%', padding: '10px 0',
                      background: 'linear-gradient(135deg, var(--green), var(--green-dim))',
                      color: '#f0e4d2', fontWeight: 600, borderRadius: 8, fontSize: 13,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      border: 'none',
                      boxShadow: '0 3px 12px rgba(74,139,92,0.3)',
                    }}>
                      <CheckCircle size={14} /> Marcar como listo
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <style>{`
        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}