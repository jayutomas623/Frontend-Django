// Kitchen.jsx — Monitor de Pedidos con Swipe Gestures
// Swipe derecha: avanzar estado | Swipe izquierda: cancelar pedido
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  LayoutList, Clock, CheckCircle, RefreshCw, XCircle, X,
  ChefHat, Banknote, QrCode, PlayCircle, PackageCheck,
  User, ArrowRight, ArrowLeft, AlertTriangle,
} from 'lucide-react';
import api from '../api/axios';

// ── Utilidades ───────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1) return 'Ahora';
  if (diff < 60) return `${diff} min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const playSound = (type = 'notify') => {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === 'notify') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.start(); osc.stop(ctx.currentTime + 0.7);
    }
  } catch { /* silent */ }
};

// ── Configuración columnas Kanban ─────────────────────────────────────────────
const COLS = [
  {
    id: 'en_espera', label: 'En espera', estados: ['en_espera'],
    accent: 'var(--gold)', accentBg: 'rgba(224,168,48,0.10)',
    border: 'rgba(224,168,48,0.30)', dot: 'var(--gold)',
    desc: 'Pago en efectivo pendiente', emoji: '🪙',
  },
  {
    id: 'preparando', label: 'Preparando', estados: ['confirmado', 'en_preparacion'],
    accent: 'var(--accent-light)', accentBg: 'rgba(207,100,48,0.10)',
    border: 'rgba(207,100,48,0.30)', dot: 'var(--accent)',
    desc: 'Pedidos en cocina', emoji: '👨‍🍳',
  },
  {
    id: 'listo', label: 'Listo', estados: ['listo'],
    accent: 'var(--green)', accentBg: 'rgba(74,139,92,0.10)',
    border: 'rgba(74,139,92,0.30)', dot: 'var(--green)',
    desc: 'Esperando entrega', emoji: '🛎️',
  },
];

const SUB_BADGE = {
  confirmado:     { label: 'Confirmado',  color: 'var(--gold)',         bg: 'rgba(224,168,48,0.12)' },
  en_preparacion: { label: 'En cocina',   color: 'var(--accent-light)', bg: 'rgba(207,100,48,0.12)' },
};

// ── Lógica de acciones de swipe por rol y estado ──────────────────────────────
function getSwipeRightAction(order, rol) {
  const esCajero = ['cajero', 'admin'].includes(rol);
  const esCocina = ['cocina', 'admin'].includes(rol);
  if (esCajero && order.estado === 'en_espera')
    return { action: 'confirm_payment', label: 'Confirmar pago', color: '#e0a830', bg: 'rgba(224,168,48,0.18)', icon: '✓' };
  if (esCocina && order.estado === 'confirmado')
    return { action: 'start', label: 'Iniciar prep.', color: 'var(--accent-light)', bg: 'rgba(207,100,48,0.18)', icon: '▶' };
  if (esCocina && order.estado === 'en_preparacion')
    return { action: 'ready', label: 'Marcar listo', color: '#4a8b5c', bg: 'rgba(74,139,92,0.18)', icon: '✓' };
  if (esCajero && order.estado === 'listo')
    return { action: 'deliver', label: 'Entregar', color: '#4a8b5c', bg: 'rgba(74,139,92,0.18)', icon: '📦' };
  return null;
}

function getSwipeLeftAction(order, rol) {
  const esCajero = ['cajero', 'admin'].includes(rol);
  const esCocina = ['cocina', 'admin'].includes(rol);
  const cancelable = ['en_espera', 'confirmado', 'en_preparacion'].includes(order.estado);
  if (!cancelable) return null;
  if (esCajero && order.estado === 'en_espera') return true;
  if (esCocina && ['confirmado', 'en_preparacion'].includes(order.estado)) return true;
  return null;
}

// ── Tarjeta con Swipe ─────────────────────────────────────────────────────────
function SwipeableOrderCard({ order, col, userRol, onAction, onCancelRequest }) {
  const [swipeX, setSwipeX]           = useState(0);
  const [isSwiping, setIsSwiping]     = useState(false);
  const [triggered, setTriggered]     = useState(false);
  const [exitDir, setExitDir]         = useState(null); // 'right' | 'left'
  const startXRef   = useRef(0);
  const cardRef     = useRef(null);
  const THRESHOLD   = 88;

  const rightAction = getSwipeRightAction(order, userRol);
  const leftAction  = getSwipeLeftAction(order, userRol);
  const canSwipe    = !!(rightAction || leftAction);

  const onPointerDown = (e) => {
    if (!canSwipe || triggered) return;
    startXRef.current = e.clientX;
    setIsSwiping(true);
    try { cardRef.current?.setPointerCapture(e.pointerId); } catch {}
  };

  const onPointerMove = (e) => {
    if (!isSwiping) return;
    const delta = e.clientX - startXRef.current;
    const maxR = rightAction ? 140 : 0;
    const maxL = leftAction  ? -140 : 0;
    setSwipeX(Math.max(maxL, Math.min(maxR, delta)));
  };

  const onPointerUp = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    if (swipeX >= THRESHOLD && rightAction) {
      setTriggered(true);
      setExitDir('right');
      setSwipeX(300);
      setTimeout(() => {
        onAction(order.id, rightAction.action);
      }, 350);
    } else if (swipeX <= -THRESHOLD && leftAction) {
      setSwipeX(0);
      onCancelRequest(order.id);
    } else {
      setSwipeX(0);
    }
  };

  const onPointerLeave = () => {
    if (isSwiping && !triggered) {
      setIsSwiping(false);
      setSwipeX(0);
    }
  };

  const progress     = Math.min(1, Math.abs(swipeX) / THRESHOLD);
  const isGoingRight = swipeX > 0;
  const activeHint   = isGoingRight
    ? rightAction
    : (leftAction ? { label: 'Cancelar', color: 'var(--danger)', bg: 'rgba(201,92,92,0.18)', icon: '✕' } : null);

  const subBadge  = SUB_BADGE[order.estado];
  const isMyOrder = userRol === 'cliente';

  return (
    <div
      ref={cardRef}
      style={{ position: 'relative', borderRadius: 13, overflow: 'hidden', touchAction: 'pan-y', userSelect: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      {/* ── Fondo de acción revelado por el swipe ── */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 13,
        display: 'flex', alignItems: 'center',
        justifyContent: isGoingRight ? 'flex-start' : 'flex-end',
        padding: '0 20px',
        background: activeHint
          ? (isGoingRight ? activeHint.bg : 'rgba(201,92,92,0.16)')
          : 'transparent',
        opacity: Math.abs(swipeX) > 12 ? 1 : 0,
        transition: 'opacity 0.15s',
        pointerEvents: 'none',
      }}>
        {activeHint && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: isGoingRight ? activeHint.color : 'var(--danger)',
            fontWeight: 800, fontSize: 13, letterSpacing: '0.04em',
            opacity: progress, transform: `scale(${0.82 + 0.18 * progress})`,
            transition: 'transform 0.1s',
          }}>
            {isGoingRight ? (
              <><span>{activeHint.icon}</span> {activeHint.label} <ArrowRight size={14} /></>
            ) : (
              <><ArrowLeft size={14} /> {activeHint.label} <XCircle size={14} /></>
            )}
          </div>
        )}
      </div>

      {/* ── Contenido de la tarjeta (deslizable) ── */}
      <div style={{
        transform: `translateX(${swipeX}px)`,
        transition: isSwiping ? 'none' : exitDir
          ? `transform 0.35s cubic-bezier(0.4, 0, 1, 1), opacity 0.3s`
          : 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
        opacity: exitDir ? 0 : 1,
        cursor: canSwipe ? (isSwiping ? 'grabbing' : 'grab') : 'default',
        background: 'var(--surface)',
        border: `1px solid ${col.border}`,
        borderRadius: 13,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Indicadores de swipe sutiles */}
        {canSwipe && !isSwiping && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 10px', opacity: 0.18, zIndex: 1,
          }}>
            {rightAction && <ArrowRight size={11} color={rightAction.color} />}
            <div style={{ flex: 1 }} />
            {leftAction && <ArrowLeft size={11} color="var(--danger)" />}
          </div>
        )}

        {/* Header tarjeta */}
        <div style={{
          background: col.accentBg, borderBottom: `1px solid ${col.border}`,
          padding: '10px 14px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: col.dot, animation: 'pulse 2s infinite', flexShrink: 0,
            }} />
            <span style={{
              fontFamily: 'Jost, monospace', fontWeight: 700,
              fontSize: 13, letterSpacing: 1.5, color: 'var(--text)',
            }}>
              #{String(order.codigo).slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
              color: order.metodo_pago === 'qr' ? 'var(--accent-light)' : 'var(--gold)',
              background: order.metodo_pago === 'qr' ? 'rgba(207,100,48,0.1)' : 'rgba(224,168,48,0.1)',
              padding: '2px 8px', borderRadius: 10,
            }}>
              {order.metodo_pago === 'qr' ? <QrCode size={10} /> : <Banknote size={10} />}
              {order.metodo_pago === 'qr' ? 'QR' : 'Efectivo'}
            </span>
            {subBadge && (
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: subBadge.color, background: subBadge.bg,
                padding: '2px 8px', borderRadius: 10,
              }}>
                {subBadge.label}
              </span>
            )}
          </div>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '10px 14px' }}>
          {!isMyOrder && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <User size={12} color="var(--text-muted)" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.cliente_nombre}</span>
            </div>
          )}

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
            {order.items.map((it, i) => (
              <li key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 12, padding: '5px 10px',
                background: 'var(--surface2)', borderRadius: 6, color: 'var(--text)',
              }}>
                <span>{it.producto_nombre}</span>
                <span style={{
                  fontWeight: 700, color: col.accent,
                  background: col.accentBg, padding: '1px 7px', borderRadius: 4,
                }}>
                  ×{it.cantidad}
                </span>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              color: 'var(--gold)', fontWeight: 700,
              fontFamily: 'Cormorant Garamond, serif', fontSize: 15,
            }}>
              Bs. {order.total}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
              <Clock size={11} /> {timeAgo(order.creado_en)}
            </span>
          </div>

          {/* Hint de swipe para staff */}
          {canSwipe && (
            <div style={{
              marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 16, fontSize: 10, color: 'var(--text-dim)', opacity: 0.55,
            }}>
              {leftAction && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(201,92,92,0.7)' }}>
                  <ArrowLeft size={10} /> Cancelar
                </span>
              )}
              {rightAction && leftAction && <span>|</span>}
              {rightAction && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {rightAction.label} <ArrowRight size={10} />
                </span>
              )}
            </div>
          )}

          {/* Pedido listo para cliente */}
          {isMyOrder && order.estado === 'listo' && (
            <div style={{
              marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(74,139,92,0.1)',
              border: '1px solid rgba(74,139,92,0.25)',
              borderRadius: 8, padding: '8px 10px',
            }}>
              <CheckCircle size={13} color="var(--green)" />
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
                ¡Tu pedido está listo!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Monitor Principal ─────────────────────────────────────────────────────────
export default function Kitchen() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [lastUpdate,  setLastUpdate]  = useState(new Date());
  const [actionMsg,   setActionMsg]   = useState('');
  const [actionOk,    setActionOk]    = useState(false);

  // Modal de cancelación en DOS pasos
  const [cancelStep,   setCancelStep]   = useState(0); // 0=cerrado, 1=confirmar, 2=motivo
  const [cancelOrder,  setCancelOrder]  = useState(null);
  const [motivo,       setMotivo]       = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const prevCountRef  = useRef(0);
  const prevListoRef  = useRef([]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/orders/monitor/');
      const data = r.data;
      setOrders(data);
      setLastUpdate(new Date());
      if (['cajero', 'cocina', 'admin'].includes(user.rol)) {
        if (data.length > prevCountRef.current && prevCountRef.current !== 0) playSound('notify');
      }
      if (user.rol === 'cliente') {
        const listos = data.filter(o => o.estado === 'listo').map(o => o.id);
        const nuevo  = listos.find(id => !prevListoRef.current.includes(id));
        if (nuevo && prevListoRef.current.length > 0) playSound('success');
        prevListoRef.current = listos;
      }
      prevCountRef.current = data.length;
    } finally { setLoading(false); }
  }, [user.rol]);

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 10000);
    return () => clearInterval(iv);
  }, [fetchOrders]);

  const flash = (text, ok = false) => {
    setActionMsg(text);
    setActionOk(ok);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const handleAction = async (orderId, action) => {
    try {
      await api.patch(`/orders/monitor/${orderId}/action/`, { action });
      flash('✅ Acción completada.', true);
      fetchOrders();
    } catch (err) {
      flash(err.response?.data?.detail || 'Error al procesar la acción.');
    }
  };

  const openCancelRequest = (orderId) => {
    setCancelOrder(orderId);
    setCancelStep(1); // primer paso: confirmar
    setMotivo('');
  };

  const handleCancelConfirm = () => {
    setCancelStep(2); // segundo paso: motivo
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!motivo.trim()) return;
    setCancelLoading(true);
    try {
      await api.patch(`/orders/monitor/${cancelOrder}/action/`, {
        action: 'cancel',
        motivo_cancelacion: motivo,
      });
      flash('Pedido cancelado. Stock devuelto.', false);
      fetchOrders();
    } catch (err) {
      flash(err.response?.data?.detail || 'Error al cancelar.');
    } finally {
      setCancelLoading(false);
      setCancelStep(0);
      setCancelOrder(null);
      setMotivo('');
    }
  };

  const closeCancelModal = () => {
    setCancelStep(0);
    setCancelOrder(null);
    setMotivo('');
  };

  const ROLE_LABEL = {
    cliente: 'Mis pedidos', cajero: 'Monitor de caja',
    cocina: 'Monitor de cocina', admin: 'Monitor general',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(12,8,6,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 62,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--gold), var(--accent), var(--green))' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LayoutList size={19} color="var(--accent)" />
          <div>
            <h2 style={{ fontSize: 20, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.1 }}>
              Monitor de pedidos
            </h2>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {ROLE_LABEL[user.rol] || 'Vista general'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {actionMsg && (
            <span style={{
              fontSize: 12, padding: '5px 12px', borderRadius: 7,
              color: actionOk ? 'var(--green)' : 'var(--danger)',
              background: actionOk ? 'rgba(74,139,92,0.12)' : 'var(--danger-bg)',
              animation: 'fadeIn 0.3s ease',
            }}>
              {actionMsg}
            </span>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {lastUpdate.toLocaleTimeString()}
          </span>
          <button onClick={fetchOrders} disabled={loading} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', padding: '7px 11px', borderRadius: 8,
            display: 'flex', cursor: 'pointer',
          }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </header>

      {/* Leyenda de gestos */}
      {['cajero', 'cocina', 'admin'].includes(user.rol) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24,
          padding: '10px 24px', background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-dim)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 28, height: 16, borderRadius: 4, background: 'rgba(74,139,92,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9,
            }}>→</span>
            Avanzar estado
          </span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 28, height: 16, borderRadius: 4, background: 'rgba(201,92,92,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9,
            }}>←</span>
            Cancelar pedido
          </span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>Desliza las tarjetas</span>
        </div>
      )}

      {/* Kanban */}
      <main style={{
        padding: '20px 20px 40px',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16, minHeight: 'calc(100vh - 100px)',
      }}>
        {COLS.map(col => {
          const colOrders = orders.filter(o => col.estados.includes(o.estado));
          return (
            <div key={col.id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Cabecera columna */}
              <div style={{
                background: col.accentBg,
                border: `1px solid ${col.border}`,
                borderRadius: '13px 13px 0 0', borderBottom: 'none',
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <h3 style={{ color: col.accent, fontSize: 14, fontWeight: 700, letterSpacing: '0.04em' }}>
                    {col.label}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>{col.desc}</p>
                </div>
                <span style={{
                  minWidth: 28, height: 28, borderRadius: '50%',
                  background: col.accentBg, border: `1.5px solid ${col.border}`,
                  color: col.accent, fontWeight: 700, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.3s',
                  transform: colOrders.length > 0 ? 'scale(1.1)' : 'scale(1)',
                }}>
                  {colOrders.length}
                </span>
              </div>

              {/* Tarjetas */}
              <div style={{
                flex: 1, border: `1px solid ${col.border}`,
                borderRadius: '0 0 13px 13px',
                padding: 12, display: 'flex', flexDirection: 'column', gap: 10,
                minHeight: 300, background: 'rgba(15,9,5,0.4)',
                overflowY: 'auto', maxHeight: 'calc(100vh - 190px)',
              }}>
                {loading && colOrders.length === 0 ? (
                  [1, 2].map(i => (
                    <div key={i} style={{
                      height: 110, borderRadius: 13, background: 'var(--surface)',
                      animation: 'pulse 1.5s infinite',
                      animationDelay: `${i * 0.15}s`,
                    }} />
                  ))
                ) : colOrders.length === 0 ? (
                  <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 8, padding: '32px 16px', opacity: 0.35,
                    animation: 'fadeIn 0.5s ease',
                  }}>
                    <div style={{ fontSize: 36 }}>{col.emoji}</div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                      Sin pedidos aquí
                    </p>
                  </div>
                ) : (
                  colOrders.map(order => (
                    <div key={order.id} style={{ animation: 'cardIn 0.35s ease' }}>
                      <SwipeableOrderCard
                        order={order}
                        col={col}
                        userRol={user.rol}
                        onAction={handleAction}
                        onCancelRequest={openCancelRequest}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* ── MODAL CANCELACIÓN — Paso 1: Confirmar ── */}
      {cancelStep === 1 && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20, animation: 'fadeIn 0.25s ease',
        }}>
          <div style={{
            background: 'var(--surface)', width: '100%', maxWidth: 380,
            borderRadius: 18, padding: 32,
            border: '1px solid rgba(201,92,92,0.5)',
            boxShadow: '0 20px 60px rgba(201,92,92,0.2)',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(201,92,92,0.1)',
                border: '2px solid rgba(201,92,92,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <AlertTriangle size={28} color="var(--danger)" />
              </div>
              <h3 style={{
                fontSize: 22, color: 'var(--text)',
                fontFamily: 'Cormorant Garamond, serif', marginBottom: 8,
              }}>
                ¿Cancelar este pedido?
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Esta acción devolverá el stock de envasados al inventario y no se puede deshacer.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={closeCancelModal} style={{
                flex: 1, padding: '12px', borderRadius: 10,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer',
                transition: 'all 0.18s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface3)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                No, conservar
              </button>
              <button onClick={handleCancelConfirm} style={{
                flex: 1, padding: '12px', borderRadius: 10,
                background: 'var(--danger)', border: 'none',
                color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(201,92,92,0.35)',
                transition: 'all 0.18s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,92,92,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,92,92,0.35)'; }}
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CANCELACIÓN — Paso 2: Motivo ── */}
      {cancelStep === 2 && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20, animation: 'fadeIn 0.25s ease',
        }}>
          <div style={{
            background: 'var(--surface)', width: '100%', maxWidth: 440,
            borderRadius: 18, padding: 32,
            border: '1px solid rgba(201,92,92,0.4)',
            boxShadow: '0 20px 60px rgba(201,92,92,0.15)',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{
                fontSize: 21, color: 'var(--danger)',
                fontFamily: 'Cormorant Garamond, serif',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <XCircle size={20} /> Motivo de cancelación
              </h3>
              <button onClick={closeCancelModal} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: 4, borderRadius: 6,
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              Explica por qué se está cancelando. El cliente puede ver este motivo.
            </p>
            <form onSubmit={handleCancelSubmit}>
              <textarea
                required autoFocus
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ej: No hay ingredientes disponibles para este platillo..."
                style={{
                  width: '100%', padding: '12px 14px',
                  borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--surface2)', color: 'var(--text)',
                  minHeight: 90, marginBottom: 16, resize: 'none',
                  fontSize: 13, boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(201,92,92,0.5)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
              />
              <button type="submit" disabled={cancelLoading || !motivo.trim()} style={{
                width: '100%', padding: '13px',
                background: motivo.trim() ? 'var(--danger)' : 'var(--surface3)',
                color: motivo.trim() ? '#fff' : 'var(--text-dim)',
                border: 'none', borderRadius: 10, fontWeight: 600,
                cursor: motivo.trim() ? 'pointer' : 'not-allowed', fontSize: 14,
                boxShadow: motivo.trim() ? '0 4px 16px rgba(201,92,92,0.35)' : 'none',
                transition: 'all 0.2s',
              }}>
                {cancelLoading ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin    { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity: 1; }            50% { opacity: 0.45; } }
        @keyframes fadeIn  { from { opacity: 0; }               to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cardIn  { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}