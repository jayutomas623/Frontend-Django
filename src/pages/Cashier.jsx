// C:\laragon\www\Proyecto-Django\frontend\src\pages\Cashier.jsx
// Panel Cajero — Lista de pedidos en efectivo + Búsqueda por código
import { useState, useEffect, useCallback } from 'react';
import {
  Banknote, Search, CheckCircle, PackageCheck,
  Clock, QrCode, RefreshCw, LayoutList, X,
} from 'lucide-react';
import api from '../api/axios';

// ── Badge de estado ──────────────────────────────────────────────────────────
const ESTADO_BADGE = {
  en_espera:      { label: 'Esperando pago',  color: 'var(--gold)',         bg: 'rgba(224,168,48,0.12)'  },
  confirmado:     { label: 'Confirmado',       color: 'var(--accent-light)', bg: 'rgba(207,100,48,0.12)'  },
  en_preparacion: { label: 'En preparación',   color: 'var(--accent-light)', bg: 'rgba(207,100,48,0.12)'  },
  listo:          { label: 'Listo ✓',          color: 'var(--green)',        bg: 'rgba(74,139,92,0.12)'   },
  entregado:      { label: 'Entregado',         color: 'var(--text-muted)',   bg: 'var(--surface2)'        },
};

// ── Tarjeta de pedido en la lista ────────────────────────────────────────────
function OrderCard({ order, onConfirm, onDeliver, compact = false }) {
  const badge = ESTADO_BADGE[order.estado] || ESTADO_BADGE.en_espera;

  return (
    <div style={{
      background:   'var(--surface)',
      border:       '1px solid var(--border)',
      borderRadius: 12,
      overflow:     'hidden',
      animation:    'fadeUp 0.3s ease',
      borderLeft:   order.estado === 'en_espera'
        ? '3px solid var(--gold)'
        : order.estado === 'listo'
          ? '3px solid var(--green)'
          : '3px solid var(--border)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: 'Jost, monospace', fontWeight: 700, fontSize: 14, letterSpacing: 1.5, color: 'var(--text)' }}>
          #{String(order.codigo).slice(0, 8).toUpperCase()}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gold)', background: 'rgba(224,168,48,0.1)', padding: '2px 8px', borderRadius: 10 }}>
            <Banknote size={10} /> Efectivo
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: badge.color, background: badge.bg, padding: '3px 10px', borderRadius: 20 }}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Items */}
      {!compact && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
          {order.items.map((it, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text)', padding: '4px 10px', background: 'var(--surface2)', borderRadius: 6, marginBottom: 4 }}>
              <span>{it.producto_nombre} ×{it.cantidad}</span>
              <span style={{ color: 'var(--gold)', fontWeight: 600, fontFamily: 'Cormorant Garamond, serif' }}>
                Bs. {it.subtotal}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Total + acciones */}
      <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: 'Cormorant Garamond, serif', fontSize: 18 }}>
          Bs. {order.total}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {order.estado === 'en_espera' && (
            <button
              onClick={() => onConfirm(order.id)}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #e0a830, #c8902a)',
                color: '#fff', fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(224,168,48,0.35)',
              }}
            >
              <CheckCircle size={13} /> Confirmar pago
            </button>
          )}
          {order.estado === 'listo' && (
            <button
              onClick={() => onDeliver(order.id)}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, var(--green), #3a7a50)',
                color: '#fff', fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(74,139,92,0.35)',
              }}
            >
              <PackageCheck size={13} /> Entregar
            </button>
          )}
          {['confirmado', 'en_preparacion'].includes(order.estado) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
              <Clock size={12} /> En cocina…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Panel principal ──────────────────────────────────────────────────────────
export default function Cashier() {
  const [tab,        setTab]        = useState('lista');  // 'lista' | 'buscar'
  const [cashOrders, setCashOrders] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Búsqueda
  const [codigo,      setCodigo]      = useState('');
  const [searchOrder, setSearchOrder] = useState(null);
  const [searchErr,   setSearchErr]   = useState('');
  const [searchLoad,  setSearchLoad]  = useState(false);

  // Feedback
  const [msg, setMsg] = useState('');

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3500); };

  // ── Fetch lista de pedidos en efectivo ──────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const r = await api.get('/orders/cashier-list/');
      setCashOrders(r.data);
    } catch { /* silent */ }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => {
    fetchList();
    const iv = setInterval(fetchList, 12000);
    return () => clearInterval(iv);
  }, [fetchList]);

  // ── Búsqueda por código ──────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!codigo.trim()) return;
    setSearchErr(''); setSearchOrder(null);
    setSearchLoad(true);
    try {
      const r = await api.get(`/orders/cashier-search/?codigo=${codigo.trim()}`);
      setSearchOrder(r.data);
    } catch {
      setSearchErr('Pedido no encontrado. Verifica el código.');
    } finally {
      setSearchLoad(false);
    }
  };

  // ── Acción confirmar pago ────────────────────────────────────────────────
  const handleConfirm = async (orderId) => {
    try {
      await api.patch(`/orders/monitor/${orderId}/action/`, { action: 'confirm_payment' });
      flash('✅ Pago confirmado. Pedido enviado a cocina.');
      fetchList();
      if (searchOrder?.id === orderId) {
        const r = await api.get(`/orders/cashier-search/?codigo=${searchOrder.codigo}`);
        setSearchOrder(r.data);
      }
    } catch (err) {
      flash('❌ ' + (err.response?.data?.detail || 'Error al confirmar pago.'));
    }
  };

  // ── Acción entregar ──────────────────────────────────────────────────────
  const handleDeliver = async (orderId) => {
    try {
      await api.patch(`/orders/monitor/${orderId}/action/`, { action: 'deliver' });
      flash('✅ Pedido marcado como entregado.');
      fetchList();
      if (searchOrder?.id === orderId) setSearchOrder(null);
    } catch (err) {
      flash('❌ ' + (err.response?.data?.detail || 'Error al entregar.'));
    }
  };

  const pendingCount = cashOrders.filter(o => o.estado === 'en_espera').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(12,8,6,0.94)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 62,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--gold), var(--accent))' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Banknote size={19} color="var(--gold)" />
          <h2 style={{ fontSize: 22, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
            Panel Cajero
          </h2>
          {pendingCount > 0 && (
            <span style={{ background: 'var(--gold)', color: '#1a1108', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
              {pendingCount}
            </span>
          )}
        </div>
        <button
          onClick={fetchList}
          disabled={loadingList}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '7px 11px', borderRadius: 8, display: 'flex', cursor: 'pointer' }}
        >
          <RefreshCw size={13} style={{ animation: loadingList ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px' }}>

        {/* Feedback */}
        {msg && (
          <div style={{
            padding: '11px 16px', borderRadius: 9, marginBottom: 18, fontSize: 13,
            background: msg.startsWith('✅') ? 'var(--success-bg)' : 'var(--danger-bg)',
            color:      msg.startsWith('✅') ? 'var(--success)'    : 'var(--danger)',
            border:     msg.startsWith('✅') ? '1px solid rgba(90,184,125,0.3)' : '1px solid rgba(201,92,92,0.3)',
          }}>
            {msg}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          {[
            { id: 'lista',  label: 'Lista de pedidos', icon: LayoutList },
            { id: 'buscar', label: 'Buscar por código', icon: Search },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                padding: '9px 18px', borderRadius: 9, border: 'none',
                background: tab === id
                  ? 'linear-gradient(135deg, rgba(224,168,48,0.15), rgba(224,168,48,0.05))'
                  : 'transparent',
                border: `1px solid ${tab === id ? 'rgba(224,168,48,0.4)' : 'transparent'}`,
                color: tab === id ? 'var(--gold)' : 'var(--text-muted)',
                fontWeight: tab === id ? 600 : 400,
                display: 'flex', alignItems: 'center', gap: 7,
                fontSize: 13, cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* ── TAB: Lista ─────────────────────────────────────────────────── */}
        {tab === 'lista' && (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Pedidos en efectivo pendientes de confirmación. Se actualiza automáticamente cada 12 segundos.
            </p>

            {loadingList && cashOrders.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: 100, borderRadius: 12, background: 'var(--surface)', animation: 'pulse 1.5s infinite', animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            ) : cashOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>🪙</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  No hay pedidos en efectivo pendientes.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cashOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onConfirm={handleConfirm}
                    onDeliver={handleDeliver}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Buscar ────────────────────────────────────────────────── */}
        {tab === 'buscar' && (
          <div>
            <h3 style={{ fontSize: 22, marginBottom: 6, fontFamily: 'Cormorant Garamond, serif' }}>
              Buscar pedido
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Ingresa el código que muestra el cliente en su pantalla.
            </p>

            {/* Buscador */}
            <div style={{ display: 'flex', gap: 9, marginBottom: 20 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  value={codigo}
                  onChange={e => setCodigo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Código del pedido (ej: A1B2C3D4)..."
                  style={{ paddingLeft: 40, background: 'var(--surface)' }}
                />
                {codigo && (
                  <button onClick={() => { setCodigo(''); setSearchOrder(null); setSearchErr(''); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={searchLoad || !codigo.trim()}
                style={{
                  padding: '0 22px', borderRadius: 9, border: 'none',
                  background: 'linear-gradient(135deg, #e0a830, #c8902a)',
                  color: '#fff', fontWeight: 600, fontSize: 13,
                  boxShadow: '0 3px 12px rgba(224,168,48,0.3)',
                  cursor: codigo.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                {searchLoad ? '...' : 'Buscar'}
              </button>
            </div>

            {searchErr && (
              <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(201,92,92,0.3)', color: 'var(--danger)', borderRadius: 9, padding: '11px 16px', marginBottom: 16, fontSize: 13 }}>
                {searchErr}
              </div>
            )}

            {searchOrder && (
              <OrderCard
                order={searchOrder}
                onConfirm={handleConfirm}
                onDeliver={handleDeliver}
              />
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
      `}</style>
    </div>
  );
}