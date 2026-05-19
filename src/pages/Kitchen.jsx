// frontend/src/pages/Kitchen.jsx
// Tarjetas deslizables: derecha = avanzar estado, izquierda = cancelar
import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, CheckCircle, ChefHat, Package, MapPin, X } from 'lucide-react';
import api from '../api/axios';

const COLS = [
  { key: 'confirmado',     label: 'En espera',  color: 'var(--gold)',   icon: Clock       },
  { key: 'en_preparacion', label: 'Preparando', color: 'var(--accent)', icon: ChefHat     },
  { key: 'listo',          label: 'Listo',       color: 'var(--green)',  icon: CheckCircle },
];

const ACTION_MAP = {
  en_preparacion: 'start',
  listo:          'ready',
  entregado:      'deliver',
};

const NEXT = {
  confirmado:     'en_preparacion',
  en_preparacion: 'listo',
  listo:          'entregado',
};

const NEXT_LABEL = {
  confirmado:     'Iniciar preparación',
  en_preparacion: 'Marcar listo',
  listo:          'Entregar',
};

function elapsed(creado_en) {
  const diff = Math.floor((Date.now() - new Date(creado_en).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  return `${Math.floor(diff / 3600)}h`;
}

// ── Modal de cancelación ──────────────────────────────────────────────────────
function CancelModal({ order, onConfirm, onClose }) {
  const [motivo, setMotivo] = useState('');
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--danger)',
        borderRadius: 16, padding: 28, width: '100%', maxWidth: 400,
        animation: 'slideUp 0.25s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: 'var(--danger)', fontSize: 18, fontFamily: 'Cormorant Garamond, serif' }}>
            Cancelar pedido
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Pedido <strong style={{ color: 'var(--text)', fontFamily: 'monospace' }}>
            #{String(order.codigo).slice(0, 8).toUpperCase()}
          </strong>
        </p>
        <textarea
          autoFocus
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          placeholder="Motivo de cancelación (obligatorio)..."
          style={{
            width: '100%', minHeight: 90, padding: '10px 14px',
            borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--surface2)', color: 'var(--text)',
            fontSize: 13, resize: 'none', marginBottom: 16,
          }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 13,
            }}
          >
            Volver
          </button>
          <button
            onClick={() => motivo.trim() && onConfirm(motivo.trim())}
            disabled={!motivo.trim()}
            style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none',
              background: motivo.trim() ? 'var(--danger)' : 'var(--surface3)',
              color: motivo.trim() ? '#fff' : 'var(--text-dim)',
              cursor: motivo.trim() ? 'pointer' : 'not-allowed',
              fontSize: 13, fontWeight: 600,
            }}
          >
            Confirmar cancelación
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta deslizable ────────────────────────────────────────────────────────
function SwipeCard({ order, onAdvance, onCancel, colColor }) {
  const [swipeX, setSwipeX]   = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [done, setDone]       = useState(false);
  const [dir, setDir]         = useState(null); // 'right' | 'left'
  const startX = useRef(0);
  const cardRef = useRef(null);
  const THRESHOLD = 90;

  const user     = JSON.parse(localStorage.getItem('user') || '{}');
  const isStaff  = ['cajero', 'cocina', 'admin'].includes(user.rol);
  const isUrgent = order.estado === 'confirmado' &&
    (Date.now() - new Date(order.creado_en).getTime()) / 1000 > 600;

  const canSwipe = isStaff && !done;

  const onPointerDown = (e) => {
    if (!canSwipe) return;
    startX.current = e.clientX;
    setSwiping(true);
    try { cardRef.current?.setPointerCapture(e.pointerId); } catch {}
  };

  const onPointerMove = (e) => {
    if (!swiping || !canSwipe) return;
    const delta = e.clientX - startX.current;
    // Derecha: solo avanzar. Izquierda: solo si puede cancelarse
    if (delta > 0) setSwipeX(Math.min(160, delta));
    else           setSwipeX(Math.max(-160, delta));
  };

  const onPointerUp = () => {
    if (!swiping) return;
    setSwiping(false);
    const abs = Math.abs(swipeX);
    if (abs >= THRESHOLD) {
      if (swipeX > 0) {
        // Deslizó derecha → avanzar
        setDir('right');
        setDone(true);
        setSwipeX(300);
        setTimeout(() => onAdvance(order.id, NEXT[order.estado]), 400);
      } else {
        // Deslizó izquierda → cancelar (solo si el estado lo permite)
        const cancelable = ['en_espera', 'confirmado', 'en_preparacion'].includes(order.estado);
        if (cancelable) {
          setDir('left');
          setDone(true);
          setSwipeX(-300);
          setTimeout(() => onCancel(order), 400);
        } else {
          setSwipeX(0);
        }
      }
    } else {
      setSwipeX(0);
    }
  };

  const progress = Math.min(1, Math.abs(swipeX) / THRESHOLD);
  const goingRight = swipeX > 0;
  const goingLeft  = swipeX < 0;
  const cancelable = ['en_espera', 'confirmado', 'en_preparacion'].includes(order.estado);

  return (
    <div style={{
      position: 'relative', borderRadius: 12,
      marginBottom: 12, overflow: 'hidden',
      touchAction: 'pan-y', userSelect: 'none',
    }}>

      {/* Fondo derecha (avanzar) */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 12,
        background: `${colColor}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        paddingLeft: 20,
        opacity: goingRight ? progress : 0,
        transition: swiping ? 'none' : 'opacity 0.2s',
        pointerEvents: 'none',
      }}>
        <span style={{
          color: colColor, fontWeight: 800, fontSize: 13,
          transform: `scale(${0.8 + 0.2 * progress})`,
          transition: swiping ? 'none' : 'transform 0.2s',
        }}>
          ✓ {NEXT_LABEL[order.estado]}
        </span>
      </div>

      {/* Fondo izquierda (cancelar) */}
      {cancelable && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 12,
          background: 'rgba(201,92,92,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          paddingRight: 20,
          opacity: goingLeft ? progress : 0,
          transition: swiping ? 'none' : 'opacity 0.2s',
          pointerEvents: 'none',
        }}>
          <span style={{
            color: 'var(--danger)', fontWeight: 800, fontSize: 13,
            transform: `scale(${0.8 + 0.2 * progress})`,
            transition: swiping ? 'none' : 'transform 0.2s',
          }}>
            ✕ Cancelar
          </span>
        </div>
      )}

      {/* Tarjeta principal */}
      <div
        ref={cardRef}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? 'none' : (done ? 'transform 0.35s ease, opacity 0.35s' : 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)'),
          opacity: done ? 0 : 1,
          background: 'var(--surface)',
          border: `1px solid ${isUrgent ? 'rgba(201,92,92,0.55)' : 'var(--border)'}`,
          borderLeft: `4px solid ${colColor}`,
          borderRadius: 12, padding: 16,
          boxShadow: isUrgent ? '0 0 16px rgba(201,92,92,0.2)' : '0 2px 8px rgba(0,0,0,0.2)',
          cursor: canSwipe ? 'grab' : 'default',
          position: 'relative',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >

        {/* Hint de swipe (visible solo si no se ha deslizado aún) */}
        {canSwipe && swipeX === 0 && !done && (
          <div style={{
            position: 'absolute', top: 8, right: 10,
            fontSize: 10, color: 'rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', gap: 3,
            pointerEvents: 'none',
          }}>
            ← desliza →
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>
                #{String(order.codigo).substring(0, 8).toUpperCase()}
              </p>
              {order.mesa_numero && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 700,
                  background: 'rgba(74,139,92,0.15)',
                  color: 'var(--green)',
                  border: '1px solid rgba(74,139,92,0.35)',
                  padding: '2px 8px', borderRadius: 12,
                }}>
                  <MapPin size={10} /> Mesa {order.mesa_numero}
                </span>
              )}
              {isUrgent && (
                <span style={{ fontSize: 10, background: 'rgba(201,92,92,0.15)', color: 'var(--danger)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                  ⚠ URGENTE
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {order.cliente_nombre}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> {elapsed(order.creado_en)}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              {order.metodo_pago === 'qr' ? '📲 QR' : '💵 Efectivo'}
            </p>
          </div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: 12 }}>
          {order.items.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 0', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {item.tipo === 'envasado' ? <Package size={12} color="var(--text-dim)" /> : '🍽'}
                {item.cantidad}× {item.producto_nombre}
              </span>
              <span style={{ fontSize: 12, color: 'var(--gold)' }}>
                Bs.{(item.cantidad * item.precio_unitario).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
            Total: Bs. {parseFloat(order.total).toFixed(2)}
          </span>
          {/* Indicador visual del próximo estado */}
          {isStaff && (
            <span style={{ fontSize: 11, color: colColor, opacity: 0.7 }}>
              → {NEXT_LABEL[order.estado]}
            </span>
          )}
        </div>
      </div>

      {/* Overlay de éxito post-swipe */}
      {done && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 12,
          background: dir === 'right' ? `${colColor}20` : 'rgba(201,92,92,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease',
        }}>
          <p style={{ color: dir === 'right' ? colColor : 'var(--danger)', fontWeight: 700, fontSize: 13 }}>
            {dir === 'right' ? '✅ Actualizando...' : '❌ Cancelando...'}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Kitchen() {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [cancelOrder, setCancelOrder] = useState(null); // pedido pendiente de cancelar
  const prevIds = useRef(new Set());

  const fetchOrders = useCallback(async () => {
    try {
      const r = await api.get('/orders/monitor/');
      const active = r.data.filter(o =>
        ['confirmado', 'en_preparacion', 'listo'].includes(o.estado)
      );
      const newIds = new Set(active.map(o => o.id));
      const hasNew = active.some(o => !prevIds.current.has(o.id));
      if (hasNew && prevIds.current.size > 0) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.start(); osc.stop(ctx.currentTime + 0.5);
        } catch {}
      }
      prevIds.current = newIds;
      setOrders(active);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 10000);
    return () => clearInterval(iv);
  }, []);

  const advance = async (id, nextEstado) => {
    const action = ACTION_MAP[nextEstado];
    if (!action) return;
    try {
      await api.patch(`/orders/monitor/${id}/action/`, { action });
      fetchOrders();
    } catch (e) { console.error(e); }
  };

  const handleCancelRequest = (order) => {
    setCancelOrder(order);
  };

  const handleCancelConfirm = async (motivo) => {
    if (!cancelOrder) return;
    try {
      await api.patch(`/orders/monitor/${cancelOrder.id}/action/`, {
        action: 'cancel',
        motivo_cancelacion: motivo,
      });
      setCancelOrder(null);
      fetchOrders();
    } catch (e) { console.error(e); }
  };

  const byCol = (key) => orders.filter(o => o.estado === key);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Modal cancelación */}
      {cancelOrder && (
        <CancelModal
          order={cancelOrder}
          onConfirm={handleCancelConfirm}
          onClose={() => { setCancelOrder(null); fetchOrders(); }}
        />
      )}

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(12,8,6,0.96)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--green), var(--gold), var(--accent))' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ChefHat size={18} color="var(--accent)" />
          <h2 style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', color: 'var(--text)' }}>
            Monitor de Pedidos
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          {COLS.map(col => (
            <span key={col.key} style={{ fontSize: 13, color: col.color, fontWeight: 600 }}>
              {byCol(col.key).length} {col.label}
            </span>
          ))}
        </div>
      </header>

      {/* Leyenda de gestos */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 24, padding: '10px 0',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'var(--green)', fontWeight: 700 }}>→</span> Desliza derecha para avanzar
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'var(--danger)', fontWeight: 700 }}>←</span> Desliza izquierda para cancelar
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Cargando pedidos...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20, padding: 24, minHeight: 'calc(100vh - 100px)',
        }}>
          {COLS.map(col => {
            const colOrders = byCol(col.key);
            const Icon = col.icon;
            return (
              <div key={col.key}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                  paddingBottom: 12, borderBottom: `2px solid ${col.color}33`,
                }}>
                  <Icon size={17} color={col.color} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: col.color }}>
                    {col.label}
                  </h3>
                  <span style={{
                    marginLeft: 'auto', background: `${col.color}22`,
                    color: col.color, border: `1px solid ${col.color}44`,
                    padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  }}>
                    {colOrders.length}
                  </span>
                </div>

                {colOrders.length === 0 ? (
                  <div style={{
                    padding: 28, textAlign: 'center', color: 'var(--text-dim)',
                    fontSize: 13, borderRadius: 10,
                    border: '1px dashed var(--border)', opacity: 0.5,
                  }}>
                    Sin pedidos
                  </div>
                ) : (
                  colOrders.map(order => (
                    <SwipeCard
                      key={order.id}
                      order={order}
                      colColor={col.color}
                      onAdvance={advance}
                      onCancel={handleCancelRequest}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
