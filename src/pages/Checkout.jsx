import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Banknote, Trash2, ShoppingBag, MapPin, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../api/axios';

// Colores de estado para el selector visual de mesas
const MESA_COLOR = {
  libre:     'var(--green)',
  ocupada:   'var(--danger)',
  reservada: 'var(--gold)',
};

export default function Checkout() {
  const { items, total, clearCart, removeItem, mesaActual, setMesaActual } = useCart();
  const [metodoPago,   setMetodoPago]   = useState('qr');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [mesas,        setMesas]        = useState([]);
  const [loadingMesas, setLoadingMesas] = useState(false);
  const [showMesas,    setShowMesas]    = useState(false);
  const navigate = useNavigate();

  // Cargar mesas disponibles para selección
  useEffect(() => {
    if (mesaActual) return; // ya tiene mesa (vino de QR), no cargar
    setLoadingMesas(true);
    api.get('/mesas/mesas/')
      .then(r => setMesas(r.data.filter(m => m.estado === 'libre')))
      .catch(() => {})
      .finally(() => setLoadingMesas(false));
  }, [mesaActual]);

  const handleSelectMesa = (mesa) => {
    setMesaActual({ id: mesa.id, numero: mesa.numero });
    setShowMesas(false);
  };

  const handleQuitarMesa = () => {
    setMesaActual(null);
    setShowMesas(false);
  };

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

        {/* ── SELECTOR DE MESA ──────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--surface)', border: `1px solid ${mesaActual ? 'rgba(74,139,92,0.4)' : 'var(--border)'}`,
          borderRadius: 14, marginBottom: 16, overflow: 'hidden',
          transition: 'border-color 0.2s',
        }}>
          <button
            onClick={() => setShowMesas(s => !s)}
            style={{
              width: '100%', padding: '14px 18px',
              background: mesaActual ? 'rgba(74,139,92,0.08)' : 'transparent',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: mesaActual ? 'rgba(74,139,92,0.15)' : 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MapPin size={15} color={mesaActual ? 'var(--green)' : 'var(--text-muted)'} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: mesaActual ? 'var(--green)' : 'var(--text)' }}>
                  {mesaActual ? `Mesa ${mesaActual.numero} seleccionada` : 'Seleccionar mesa (opcional)'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  {mesaActual
                    ? 'Tu pedido se entregará en esta mesa'
                    : 'Puedes pedir sin mesa o seleccionar una disponible'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {mesaActual && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleQuitarMesa(); }}
                  style={{ background: 'rgba(201,92,92,0.1)', border: '1px solid rgba(201,92,92,0.3)', color: 'var(--danger)', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <X size={11} /> Quitar
                </button>
              )}
              {showMesas ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
            </div>
          </button>

          {/* Lista de mesas disponibles */}
          {showMesas && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
              {loadingMesas ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                  Cargando mesas disponibles...
                </p>
              ) : mesas.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                  No hay mesas libres disponibles en este momento.
                </p>
              ) : (
                <>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Mesas libres disponibles
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                    {/* Opción sin mesa */}
                    <button
                      onClick={handleQuitarMesa}
                      style={{
                        padding: '10px 6px', borderRadius: 8, cursor: 'pointer',
                        border: `1.5px solid ${!mesaActual ? 'var(--accent)' : 'var(--border)'}`,
                        background: !mesaActual ? 'rgba(207,100,48,0.1)' : 'var(--surface2)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 16 }}>🚶</span>
                      <span style={{ fontSize: 10, color: !mesaActual ? 'var(--accent)' : 'var(--text-muted)', fontWeight: !mesaActual ? 700 : 400 }}>
                        Sin mesa
                      </span>
                    </button>

                    {/* Mesas libres */}
                    {mesas.map(mesa => {
                      const selected = mesaActual?.id === mesa.id;
                      return (
                        <button
                          key={mesa.id}
                          onClick={() => handleSelectMesa(mesa)}
                          style={{
                            padding: '10px 6px', borderRadius: 8, cursor: 'pointer',
                            border: `1.5px solid ${selected ? 'var(--green)' : 'var(--border)'}`,
                            background: selected ? 'rgba(74,139,92,0.12)' : 'var(--surface2)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                            transition: 'all 0.15s',
                            boxShadow: selected ? '0 2px 8px rgba(74,139,92,0.2)' : 'none',
                          }}
                        >
                          <span style={{ fontSize: 18, fontWeight: 800, color: selected ? 'var(--green)' : 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
                            {mesa.numero}
                          </span>
                          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                            {mesa.capacidad} pers.
                          </span>
                          {selected && (
                            <span style={{ fontSize: 9, color: 'var(--green)', fontWeight: 700 }}>✓ elegida</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Items */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={15} color="var(--accent)" />
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {items.length} producto(s)
            </p>
          </div>

          {items.map(i => (
            <div key={i.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
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
                  background: 'none', color: 'var(--text-dim)', padding: 5, borderRadius: 6,
                  display: 'flex', border: '1px solid var(--border)', transition: 'color 0.15s, border-color 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(201,92,92,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--surface2)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>Total</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold)', fontFamily: 'Cormorant Garamond, serif' }}>
              Bs. {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Método de pago */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
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
          <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(201,92,92,0.3)', color: 'var(--danger)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleOrder}
          disabled={loading || items.length === 0}
          style={{
            width: '100%', padding: '15px 0',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
            color: '#f0e4d2', fontWeight: 700, borderRadius: 10, fontSize: 16,
            border: 'none', letterSpacing: '0.02em',
            boxShadow: '0 4px 20px rgba(207,100,48,0.32)',
          }}
        >
          {loading ? 'Procesando...' : `Confirmar pedido${mesaActual ? ` · Mesa ${mesaActual.numero}` : ''}`}
        </button>

        {!mesaActual && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10 }}>
            Sin mesa seleccionada — el pedido será para llevar o recoger en barra
          </p>
        )}
      </div>

      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
