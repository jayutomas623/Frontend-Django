// frontend/src/pages/Checkout.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Banknote, Trash2, ShoppingBag, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../api/axios';

export default function Checkout() {
  const { items, total, clearCart, removeItem, mesaActual } = useCart();
  const [metodoPago, setMetodoPago] = useState('qr');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const navigate = useNavigate();

  const handleOrder = async () => {
    if (items.length === 0) return;
    setLoading(true); setError('');
    try {
      const payload = {
        metodo_pago: metodoPago,
        items: items.map(i => ({ producto_id: i.id, cantidad: i.cantidad })),
      };
      if (mesaActual?.id) {
        payload.mesa_id = mesaActual.id;
      }
      const res = await api.post('/orders/', payload);
      clearCart();
      navigate(metodoPago === 'qr' ? '/payment/qr' : '/payment/cash', { state: { order: res.data } });
    } catch (err) {
      const data = err.response?.data;
      const msg  = Array.isArray(data) ? data[0] : data?.detail || 'Error al crear el pedido. Intenta de nuevo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '28px 24px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <button onClick={() => navigate('/menu')} style={{
            background: 'var(--surface)', color: 'var(--text)',
            padding: '8px 13px', borderRadius: 8, border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          }}>
            <ArrowLeft size={15} /> Volver
          </button>
          <h2 style={{ fontSize: 28, fontFamily: 'Cormorant Garamond, serif' }}>
            Tu pedido
          </h2>
        </div>

        {/* Mesa indicator */}
        {mesaActual && (
          <div style={{
            background: 'rgba(74,139,92,0.1)', border: '1px solid rgba(74,139,92,0.3)',
            borderRadius: 10, padding: '10px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <MapPin size={14} color="var(--green)" />
            <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
              Pedido para Mesa {mesaActual.numero}
            </span>
          </div>
        )}

        {/* Items */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 14, marginBottom: 16, overflow: 'hidden',
        }}>
          <div style={{
            padding: '15px 20px', borderBottom: '1px solid var(--border)',
            background: 'var(--surface2)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <ShoppingBag size={15} color="var(--accent)" />
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {items.length} producto(s)
            </p>
          </div>

          {items.map(i => (
            <div key={i.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderBottom: '1px solid var(--border)',
            }}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)' }}>{i.nombre}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                  {i.cantidad} × Bs. {Number(i.precio).toFixed(2)}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 15, fontFamily: 'Cormorant Garamond, serif' }}>
                  Bs. {(Number(i.precio) * i.cantidad).toFixed(2)}
                </span>
                <button onClick={() => removeItem(i.id)} style={{
                  background: 'none', color: 'var(--text-dim)', padding: 5,
                  borderRadius: 6, display: 'flex', border: '1px solid var(--border)',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(201,92,92,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', background: 'var(--surface2)',
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>Total</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold)', fontFamily: 'Cormorant Garamond, serif' }}>
              Bs. {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Método de pago */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 14, padding: 20, marginBottom: 20,
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Método de pago
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { value: 'qr',       label: 'Pago QR',  Icon: QrCode   },
              { value: 'efectivo', label: 'Efectivo', Icon: Banknote },
            ].map(({ value, label, Icon }) => {
              const active = metodoPago === value;
              return (
                <button key={value} onClick={() => setMetodoPago(value)} style={{
                  flex: 1, padding: '16px 10px', borderRadius: 10,
                  background: active
                    ? 'linear-gradient(135deg, rgba(207,100,48,0.15), rgba(207,100,48,0.05))'
                    : 'var(--surface2)',
                  border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  color: active ? 'var(--accent-light)' : 'var(--text-muted)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  fontWeight: active ? 600 : 400, transition: 'all 0.18s',
                  boxShadow: active ? '0 3px 12px rgba(207,100,48,0.2)' : 'none',
                }}>
                  <Icon size={22} />
                  <span style={{ fontSize: 13 }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)', border: '1px solid rgba(201,92,92,0.3)',
            color: 'var(--danger)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <button onClick={handleOrder} disabled={loading || items.length === 0} style={{
          width: '100%', padding: '15px 0',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
          color: '#f0e4d2', fontWeight: 700, borderRadius: 10, fontSize: 16,
          border: 'none', letterSpacing: '0.02em',
          boxShadow: '0 4px 20px rgba(207,100,48,0.32)',
        }}>
          {loading ? 'Procesando...' : 'Confirmar pedido'}
        </button>
      </div>

      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
