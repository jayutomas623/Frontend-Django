import { useState } from 'react';
import { Search, CheckCircle, PackageCheck, Clock, Banknote, QrCode } from 'lucide-react';
import api from '../api/axios';

const ESTADO_BADGE = {
  en_espera:      { label: 'Esperando pago',  color: 'var(--gold)',         bg: 'rgba(224,168,48,0.12)'  },
  confirmado:     { label: 'Confirmado',       color: 'var(--accent-light)', bg: 'rgba(207,100,48,0.12)'  },
  en_preparacion: { label: 'En preparación',  color: 'var(--accent-light)', bg: 'rgba(207,100,48,0.12)'  },
  listo:          { label: 'Listo',           color: 'var(--green)',        bg: 'rgba(74,139,92,0.12)'   },
  entregado:      { label: 'Entregado',       color: 'var(--text-muted)',   bg: 'var(--surface2)'        },
};

export default function Cashier() {
  const [codigo, setCodigo]   = useState('');
  const [order, setOrder]     = useState(null);
  const [msg, setMsg]         = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!codigo.trim()) return;
    setError(''); setMsg(''); setOrder(null);
    setLoading(true);
    try {
      const res = await api.get(`/orders/cashier/?codigo=${codigo.trim()}`);
      setOrder(res.data);
    } catch {
      setError('Pedido no encontrado. Verifica el código.');
    } finally {
      setLoading(false);
    }
  };

  const confirmCash = async () => {
    try {
      await api.patch(`/orders/${order.codigo}/confirm-payment/`);
      setMsg('Pago confirmado. El pedido fue enviado a cocina.');
      setOrder(null); setCodigo('');
    } catch {
      setError('Error al confirmar el pago.');
    }
  };

  const markDelivered = async () => {
    try {
      await api.patch(`/orders/cashier/${order.id}/deliver/`);
      setMsg('Pedido marcado como entregado.');
      setOrder(null); setCodigo('');
    } catch {
      setError('Error al marcar como entregado.');
    }
  };

  const badge = order ? ESTADO_BADGE[order.estado] : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(12,8,6,0.93)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 62,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, var(--gold), var(--accent))',
        }} />
        <Banknote size={19} color="var(--gold)" />
        <h2 style={{ fontSize: 22, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
          Panel Cajero
        </h2>
      </header>

      <main style={{ maxWidth: 580, margin: '0 auto', padding: '36px 28px', animation: 'fadeUp 0.35s ease' }}>

        <h3 style={{ fontSize: 26, marginBottom: 6, fontFamily: 'Cormorant Garamond, serif' }}>
          Buscar pedido
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
          Ingresa el código para confirmar el pago o marcar como entregado.
        </p>

        {/* Buscador */}
        <div style={{ display: 'flex', gap: 9, marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{
              position: 'absolute', left: 13, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-dim)',
            }} />
            <input
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Código del pedido..."
              style={{ paddingLeft: 40, background: 'var(--surface)' }}
            />
          </div>
          <button
            onClick={search}
            disabled={loading || !codigo.trim()}
            style={{
              padding: '0 22px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
              color: '#f0e4d2', fontWeight: 600, borderRadius: 8, fontSize: 14,
              border: 'none',
              boxShadow: '0 3px 12px rgba(207,100,48,0.28)',
            }}
          >
            {loading ? '...' : 'Buscar'}
          </button>
        </div>

        {/* Mensajes */}
        {msg && (
          <div style={{
            background: 'var(--success-bg)', border: '1px solid rgba(90,184,125,0.3)',
            color: 'var(--success)', borderRadius: 9,
            padding: '12px 16px', marginBottom: 18, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 9,
          }}>
            <CheckCircle size={15} /> {msg}
          </div>
        )}
        {error && (
          <div style={{
            background: 'var(--danger-bg)', border: '1px solid rgba(201,92,92,0.3)',
            color: 'var(--danger)', borderRadius: 9,
            padding: '12px 16px', marginBottom: 18, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Detalle */}
        {order && badge && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 6px 28px rgba(0,0,0,0.3)',
            animation: 'fadeUp 0.28s ease',
          }}>
            {/* Header */}
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--surface2)',
            }}>
              <span style={{
                fontWeight: 700, fontSize: 16,
                fontFamily: 'Jost, monospace',
                letterSpacing: 2, color: 'var(--text)',
              }}>
                #{order.codigo?.slice(0, 8).toUpperCase()}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 600, color: badge.color,
                background: badge.bg, padding: '4px 13px', borderRadius: 20,
              }}>
                {badge.label}
              </span>
            </div>

            {/* Items */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              {order.items.map((i, idx) => (
                <div key={idx} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '8px 12px', marginBottom: 5,
                  background: 'var(--surface2)', borderRadius: 8, fontSize: 13,
                  color: 'var(--text)',
                }}>
                  <span>{i.producto_nombre} ×{i.cantidad}</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 600,
                    fontFamily: 'Cormorant Garamond, serif', fontSize: 15 }}>
                    Bs. {i.subtotal}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 10,
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Método de pago</span>
                <span style={{
                  fontSize: 13, fontWeight: 500, display: 'flex',
                  alignItems: 'center', gap: 6, color: 'var(--text)',
                }}>
                  {order.metodo_pago === 'qr'
                    ? <><QrCode size={13} color="var(--accent-light)" /> QR</>
                    : <><Banknote size={13} color="var(--gold)" /> Efectivo</>
                  }
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>Total</span>
                <span style={{
                  fontSize: 24, fontWeight: 700, color: 'var(--gold)',
                  fontFamily: 'Cormorant Garamond, serif',
                }}>
                  Bs. {order.total}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {order.estado === 'en_espera' && (
                <button onClick={confirmCash} style={{
                  width: '100%', padding: '13px 0',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
                  color: '#f0e4d2', fontWeight: 700, borderRadius: 9, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 16px rgba(207,100,48,0.3)',
                }}>
                  <CheckCircle size={15} /> Confirmar pago en efectivo
                </button>
              )}
              {order.estado === 'listo' && (
                <button onClick={markDelivered} style={{
                  width: '100%', padding: '13px 0',
                  background: 'linear-gradient(135deg, var(--green), var(--green-dim))',
                  color: '#f0e4d2', fontWeight: 700, borderRadius: 9, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 16px rgba(74,139,92,0.3)',
                }}>
                  <PackageCheck size={15} /> Marcar como entregado
                </button>
              )}
              {['confirmado', 'en_preparacion'].includes(order.estado) && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  background: 'rgba(207,100,48,0.07)', borderRadius: 9, padding: 13,
                  border: '1px solid rgba(207,100,48,0.18)',
                }}>
                  <Clock size={14} color="var(--accent)" />
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Este pedido está siendo preparado en cocina.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}