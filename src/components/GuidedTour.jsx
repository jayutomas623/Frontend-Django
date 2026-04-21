// GuidedTour.jsx — Tour Guiado Interactivo por Rol
// Se muestra en el primer login y puede repetirse desde el botón (?)
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, ArrowRight, ArrowLeft, CheckCircle, ChefHat,
  Banknote, UtensilsCrossed, LayoutDashboard,
  Play, SkipForward,
} from 'lucide-react';

// ── Mock Card Swipeable (demo interactiva) ────────────────────────────────────
function MockSwipeCard({ actionLabel, actionColor, side = 'right', onComplete }) {
  const [swipeX, setSwipeX] = useState(0);
  const [done, setDone]     = useState(false);
  const [hint, setHint]     = useState(true);
  const startXRef = useRef(0);
  const isSwiping = useRef(false);
  const cardRef   = useRef(null);
  const THRESHOLD = 80;

  // Animación de hint pulsante
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setHint(h => !h), 1200);
    return () => clearInterval(id);
  }, [done]);

  const onPointerDown = (e) => {
    if (done) return;
    startXRef.current = e.clientX;
    isSwiping.current = true;
    try { cardRef.current?.setPointerCapture(e.pointerId); } catch {}
  };

  const onPointerMove = (e) => {
    if (!isSwiping.current || done) return;
    const delta = e.clientX - startXRef.current;
    if (side === 'right') setSwipeX(Math.max(0, Math.min(150, delta)));
    else setSwipeX(Math.min(0, Math.max(-150, delta)));
  };

  const onPointerUp = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    const abs = Math.abs(swipeX);
    if (abs >= THRESHOLD) {
      setSwipeX(side === 'right' ? 220 : -220);
      setDone(true);
      setTimeout(() => onComplete?.(), 700);
    } else {
      setSwipeX(0);
    }
  };

  const progress = Math.min(1, Math.abs(swipeX) / THRESHOLD);
  const isRight  = swipeX > 0;

  return (
    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', touchAction: 'pan-y', userSelect: 'none' }}>
      {/* Fondo de acción */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 10,
        background: done
          ? (side === 'right' ? 'rgba(74,139,92,0.2)' : 'rgba(201,92,92,0.2)')
          : (isRight ? `rgba(74,139,92,0.18)` : 'rgba(201,92,92,0.15)'),
        display: 'flex', alignItems: 'center',
        justifyContent: isRight ? 'flex-start' : 'flex-end',
        padding: '0 16px',
        opacity: Math.abs(swipeX) > 5 ? 1 : 0,
        transition: 'opacity 0.15s',
      }}>
        <span style={{
          color: side === 'right' ? actionColor : 'var(--danger)',
          fontWeight: 800, fontSize: 12,
          opacity: progress, transform: `scale(${0.8 + 0.2 * progress})`,
        }}>
          {side === 'right' ? `✓ ${actionLabel}` : '✕ Cancelar'}
        </span>
      </div>

      {/* Tarjeta */}
      <div
        ref={cardRef}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isSwiping.current ? 'none' : (done ? 'transform 0.4s ease, opacity 0.4s' : 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)'),
          opacity: done ? 0 : 1,
          background: 'rgba(30,20,12,0.9)',
          border: '1px solid rgba(207,100,48,0.3)',
          borderRadius: 10, padding: '14px 16px',
          cursor: done ? 'default' : 'grab',
          position: 'relative',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, letterSpacing: 2, color: 'var(--gold)' }}>
            #A4B9C2F1
          </span>
          <span style={{ fontSize: 10, background: 'rgba(224,168,48,0.15)', color: 'var(--gold)', padding: '2px 8px', borderRadius: 8 }}>
            Efectivo
          </span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '6px 10px', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(240,228,210,0.8)' }}>
            <span>Plato del día × 2</span>
            <span>Bs. 30.00</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: 'Cormorant Garamond, serif', fontSize: 16 }}>
            Bs. 30.00
          </span>
          {/* Hint animado */}
          <span style={{
            fontSize: 10, color: 'rgba(255,255,255,0.35)',
            opacity: hint ? 0.7 : 0.2, transition: 'opacity 0.6s',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {side === 'right'
              ? <><span>Desliza</span> <ArrowRight size={10} /></>
              : <><ArrowLeft size={10} /> <span>Desliza</span></>
            }
          </span>
        </div>
      </div>

      {/* Éxito */}
      {done && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: side === 'right' ? 'rgba(74,139,92,0.2)' : 'rgba(201,92,92,0.2)',
          borderRadius: 10, animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>
              {side === 'right' ? '✅' : '❌'}
            </div>
            <p style={{ fontSize: 12, color: side === 'right' ? 'var(--green)' : 'var(--danger)', fontWeight: 600 }}>
              {side === 'right' ? '¡Bien hecho!' : 'Cancelado'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Visuales de mock por rol y paso ──────────────────────────────────────────
function MockCashierPanel() {
  return (
    <div style={{ background: 'rgba(20,13,8,0.6)', borderRadius: 10, padding: 14, border: '1px solid rgba(224,168,48,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Banknote size={14} color="var(--gold)" />
        <span style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 600 }}>Panel Cajero</span>
      </div>
      {[1, 2].map(i => (
        <div key={i} style={{
          background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px',
          marginBottom: 6, borderLeft: '3px solid var(--gold)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>#{Math.random().toString(36).slice(2, 10).toUpperCase()}</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Efectivo · 2 items</p>
          </div>
          <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>Bs. {(Math.random() * 40 + 20).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

function MockKanban({ highlight }) {
  const cols = [
    { label: 'En espera', color: 'var(--gold)', bg: 'rgba(224,168,48,0.08)', active: highlight === 0 },
    { label: 'Preparando', color: 'var(--accent-light)', bg: 'rgba(207,100,48,0.08)', active: highlight === 1 },
    { label: 'Listo', color: 'var(--green)', bg: 'rgba(74,139,92,0.08)', active: highlight === 2 },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {cols.map((col, i) => (
        <div key={i} style={{
          background: col.bg,
          border: `1px solid ${col.active ? col.color : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 8, padding: 8,
          boxShadow: col.active ? `0 0 12px ${col.color}40` : 'none',
          transition: 'all 0.3s',
        }}>
          <p style={{ fontSize: 10, color: col.color, fontWeight: 700, marginBottom: 6, letterSpacing: '0.05em' }}>
            {col.label}
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '8px 10px',
            border: `1px solid ${col.active ? col.color + '40' : 'rgba(255,255,255,0.05)'}`,
          }}>
            <p style={{ fontSize: 9, color: 'rgba(240,228,210,0.6)' }}>#DEMO</p>
            <p style={{ fontSize: 11, color: 'rgba(240,228,210,0.8)', fontWeight: 600, marginTop: 2 }}>Bs. 25.00</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MockMenu() {
  const items = ['Sopa del día', 'Plato fuerte', 'Refresco natural'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {items.map((name, i) => (
        <div key={i} style={{
          background: 'rgba(255,255,255,0.04)', borderRadius: 8, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{
            height: 50, background: `linear-gradient(135deg, rgba(207,100,48,${0.1 + i * 0.05}), rgba(74,139,92,0.08))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            {['🍲', '🍖', '🥤'][i]}
          </div>
          <div style={{ padding: '8px 10px' }}>
            <p style={{ fontSize: 10, color: 'rgba(240,228,210,0.8)', fontWeight: 600 }}>{name}</p>
            <p style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>Bs. {[15, 25, 8][i]}.00</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MockDashboard() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
        {[['Bs. 340', 'Ventas hoy', 'var(--gold)'], ['12', 'Pedidos', 'var(--green)'], ['2', 'Cancelados', 'var(--danger)']].map(([v, l, c]) => (
          <div key={l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
            <p style={{ color: c, fontWeight: 700, fontSize: 16, fontFamily: 'Cormorant Garamond, serif' }}>{v}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>{l}</p>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Ventas de la semana</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 36 }}>
          {[40, 65, 30, 80, 55, 90, 70].map((h, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: 3,
              height: `${h}%`, background: `rgba(207,100,48,${0.3 + h / 250})`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Configuración de tours por rol ────────────────────────────────────────────
const TOURS = {
  cajero: {
    icon: Banknote,
    title: 'Panel de Caja — Cajero',
    color: 'var(--gold)',
    steps: [
      {
        title: 'Tu rol en Kusillu',
        desc: 'Como cajero gestionas los pagos en efectivo y entregas los pedidos. El sistema está diseñado para ser rápido y sencillo.',
        visual: 'panel',
        emoji: '💰',
      },
      {
        title: 'Tu pantalla principal',
        desc: 'En el Panel de Caja verás todos los pedidos en efectivo pendientes de confirmación. Se actualiza automáticamente cada 12 segundos.',
        visual: 'cashier',
        emoji: '📋',
      },
      {
        title: 'Confirmar un pago',
        desc: '¡Inténtalo! Desliza la tarjeta hacia la derecha para confirmar el pago. El pedido pasará automáticamente a cocina.',
        visual: 'swipe-right',
        actionLabel: 'Confirmar pago',
        actionColor: '#e0a830',
        interactive: true,
        emoji: '→',
      },
      {
        title: 'Monitor de pedidos',
        desc: 'También tienes acceso al Monitor de Pedidos. Aquí ves el flujo completo: qué hay en espera, en cocina, y listo para entregar.',
        visual: 'kanban',
        kanbanHighlight: 0,
        emoji: '🗂️',
      },
      {
        title: 'Entregar un pedido',
        desc: 'Cuando cocina marque un pedido como "Listo", desliza su tarjeta a la derecha en la columna "Listo" para marcarlo como entregado.',
        visual: 'kanban',
        kanbanHighlight: 2,
        emoji: '📦',
      },
      {
        title: 'Cancelar si es necesario',
        desc: 'Si un pedido en espera debe cancelarse, desliza la tarjeta a la izquierda. El sistema te pedirá confirmación y un motivo.',
        visual: 'swipe-left',
        interactive: true,
        emoji: '←',
      },
    ],
  },

  cocina: {
    icon: ChefHat,
    title: 'Monitor de Cocina — Cocinero',
    color: 'var(--accent-light)',
    steps: [
      {
        title: 'Tu espacio de trabajo',
        desc: 'Como personal de cocina, tu pantalla principal es el Monitor de Pedidos. Aquí ves todo lo que debes preparar en tiempo real.',
        visual: 'kanban',
        kanbanHighlight: 1,
        emoji: '👨‍🍳',
      },
      {
        title: 'Iniciar una preparación',
        desc: 'Cuando llegue un pedido confirmado, desliza su tarjeta a la derecha para indicar que empezaste a prepararlo.',
        visual: 'swipe-right',
        actionLabel: 'Iniciar preparación',
        actionColor: 'var(--accent-light)',
        interactive: true,
        emoji: '▶',
      },
      {
        title: 'Marcar como listo',
        desc: 'Al terminar un platillo, desliza su tarjeta a la derecha nuevamente para marcarlo como "Listo". El cajero sabrá que debe entregarlo.',
        visual: 'kanban',
        kanbanHighlight: 2,
        emoji: '✅',
      },
      {
        title: 'Cancelar si faltan ingredientes',
        desc: 'Si no puedes preparar algo, desliza la tarjeta a la izquierda. Deberás escribir el motivo para que quede registrado.',
        visual: 'swipe-left',
        interactive: true,
        emoji: '⚠️',
      },
      {
        title: 'Inventario a tu alcance',
        desc: 'También tienes acceso al inventario de materias primas. Puedes actualizar el semáforo de stock (verde / amarillo / rojo) desde ahí.',
        visual: 'inventory',
        emoji: '📦',
      },
    ],
  },

  admin: {
    icon: LayoutDashboard,
    title: 'Panel Administrativo — Admin',
    color: 'var(--accent)',
    steps: [
      {
        title: 'Control total del sistema',
        desc: 'Como administrador tienes acceso a todas las funciones: dashboard, empleados, inventario, monitor y más.',
        visual: 'dashboard',
        emoji: '🎛️',
      },
      {
        title: 'Dashboard en tiempo real',
        desc: 'El dashboard te muestra ventas del día, pedidos completados, productos más vendidos y un mapa de calor de horas pico.',
        visual: 'dashboard',
        emoji: '📊',
      },
      {
        title: 'Monitor sin restricciones',
        desc: 'En el Monitor de Pedidos puedes mover cualquier pedido entre estados deslizando. También puedes cancelar en cualquier momento.',
        visual: 'kanban',
        kanbanHighlight: 1,
        emoji: '🗂️',
      },
      {
        title: 'Gestión de empleados',
        desc: 'Puedes crear usuarios con rol cajero, cocina o admin. Cada uno verá solo lo que necesita para su trabajo.',
        visual: 'employees',
        emoji: '👥',
      },
      {
        title: 'Asistente operacional',
        desc: 'Tienes un chatbot en la esquina inferior derecha. Puedes preguntarle sobre ventas, pedidos activos, stock crítico y más.',
        visual: 'chatbot',
        emoji: '🤖',
      },
    ],
  },

  cliente: {
    icon: UtensilsCrossed,
    title: '¡Bienvenido a Kusillu!',
    color: 'var(--accent)',
    steps: [
      {
        title: 'El menú del restaurante',
        desc: 'Navega por nuestros platillos y bebidas. Puedes filtrar por categoría o buscar por nombre.',
        visual: 'menu',
        emoji: '🍽️',
      },
      {
        title: 'Agrega al carrito',
        desc: 'Toca el botón "Agregar" en cualquier producto. Puedes añadir varios items antes de confirmar tu pedido.',
        visual: 'menu',
        emoji: '🛒',
      },
      {
        title: 'Elige cómo pagar',
        desc: 'Al ir al checkout puedes elegir pago QR (inmediato) o efectivo en caja (muestras un código al cajero).',
        visual: 'checkout',
        emoji: '💳',
      },
      {
        title: 'Sigue tu pedido',
        desc: 'Una vez hecho el pedido puedes ver su estado en el monitor. Te avisaremos cuando esté listo para recoger.',
        visual: 'kanban',
        kanbanHighlight: 2,
        emoji: '⏱️',
      },
    ],
  },
};

// ── Visual de paso ─────────────────────────────────────────────────────────────
function StepVisual({ step, onInteractionDone }) {
  const [swipeKey, setSwipeKey] = useState(0);

  const resetSwipe = () => {
    setSwipeKey(k => k + 1);
  };

  if (!step.visual) return null;

  switch (step.visual) {
    case 'cashier':  return <MockCashierPanel />;
    case 'dashboard': return <MockDashboard />;
    case 'menu':     return <MockMenu />;
    case 'kanban':   return <MockKanban highlight={step.kanbanHighlight ?? -1} />;
    case 'panel':
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 12, border: '1px solid rgba(224,168,48,0.2)', textAlign: 'center' }}>
            <Banknote size={24} color="var(--gold)" style={{ margin: '0 auto 6px' }} />
            <p style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 600 }}>Panel Caja</p>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 12, border: '1px solid rgba(207,100,48,0.2)', textAlign: 'center' }}>
            <LayoutDashboard size={24} color="var(--accent)" style={{ margin: '0 auto 6px' }} />
            <p style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>Monitor</p>
          </div>
        </div>
      );
    case 'inventory':
      return (
        <div style={{ background: 'rgba(20,13,8,0.6)', borderRadius: 10, padding: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
          {[['Sal de cocina', 'verde'], ['Aceite vegetal', 'amarillo'], ['Arroz blanco', 'rojo']].map(([name, color]) => (
            <div key={name} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 10px', marginBottom: 5,
              background: 'rgba(255,255,255,0.03)', borderRadius: 6,
            }}>
              <span style={{ fontSize: 11, color: 'rgba(240,228,210,0.7)' }}>{name}</span>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: { verde: '#4a8b5c', amarillo: '#c8902a', rojo: '#c95c5c' }[color],
                boxShadow: `0 0 8px ${{ verde: '#4a8b5c', amarillo: '#c8902a', rojo: '#c95c5c' }[color]}60`,
              }} />
            </div>
          ))}
        </div>
      );
    case 'employees':
      return (
        <div style={{ background: 'rgba(20,13,8,0.6)', borderRadius: 10, padding: 12 }}>
          {[['Ana García', 'Cajero', 'var(--gold)'], ['Luis Mamani', 'Cocina', 'var(--accent)']].map(([n, r, c]) => (
            <div key={n} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px', marginBottom: 6,
              background: 'rgba(255,255,255,0.04)', borderRadius: 8,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: `${c}20`, border: `1px solid ${c}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: c, fontWeight: 700,
              }}>
                {n[0]}
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(240,228,210,0.8)', fontWeight: 600 }}>{n}</p>
                <p style={{ fontSize: 10, color: c }}>{r}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case 'chatbot':
      return (
        <div style={{ background: 'rgba(20,13,8,0.6)', borderRadius: 10, padding: 12, border: '1px solid rgba(207,100,48,0.2)' }}>
          {[
            { role: 'bot', text: '👋 Hola! Soy el asistente de Kusillu' },
            { role: 'user', text: '¿Cuánto vendimos hoy?' },
            { role: 'bot', text: '💰 Ventas hoy: Bs. 340.00 · 12 pedidos' },
          ].map((m, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 6,
            }}>
              <div style={{
                maxWidth: '80%', padding: '6px 10px', borderRadius: 8, fontSize: 10,
                background: m.role === 'bot' ? 'rgba(255,255,255,0.05)' : 'rgba(207,100,48,0.2)',
                color: 'rgba(240,228,210,0.8)',
                border: m.role === 'bot' ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
      );
    case 'checkout':
      return (
        <div style={{ background: 'rgba(20,13,8,0.6)', borderRadius: 10, padding: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {[['QR', '📱', 'var(--accent)'], ['Efectivo', '💵', 'var(--gold)']].map(([l, e, c]) => (
              <div key={l} style={{
                flex: 1, padding: '10px 6px', borderRadius: 8, textAlign: 'center',
                border: `1.5px solid ${l === 'QR' ? c : 'rgba(255,255,255,0.1)'}`,
                background: l === 'QR' ? `${c}15` : 'transparent',
              }}>
                <div style={{ fontSize: 20 }}>{e}</div>
                <p style={{ fontSize: 10, color: l === 'QR' ? c : 'rgba(255,255,255,0.4)', marginTop: 4 }}>{l}</p>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(207,100,48,0.15)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>Total: Bs. 30.00</p>
          </div>
        </div>
      );
    case 'swipe-right':
      return (
        <div>
          <MockSwipeCard
            key={swipeKey}
            side="right"
            actionLabel={step.actionLabel || 'Acción'}
            actionColor={step.actionColor || 'var(--green)'}
            onComplete={() => {
              setTimeout(resetSwipe, 1200);
              onInteractionDone?.();
            }}
          />
          <p style={{ fontSize: 10, textAlign: 'center', color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
            ← Arrastra la tarjeta hacia la derecha →
          </p>
        </div>
      );
    case 'swipe-left':
      return (
        <div>
          <MockSwipeCard
            key={swipeKey}
            side="left"
            actionLabel="Cancelar"
            actionColor="var(--danger)"
            onComplete={() => {
              setTimeout(resetSwipe, 1200);
              onInteractionDone?.();
            }}
          />
          <p style={{ fontSize: 10, textAlign: 'center', color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
            ← Arrastra la tarjeta hacia la izquierda ←
          </p>
        </div>
      );
    default: return null;
  }
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function GuidedTour() {
  const [isOpen,    setIsOpen]    = useState(false);
  const [step,      setStep]      = useState(0);
  const [animDir,   setAnimDir]   = useState('right'); // 'right' | 'left'
  const [animKey,   setAnimKey]   = useState(0);
  const [interacted, setInteracted] = useState(false);

  const user    = JSON.parse(localStorage.getItem('user') || '{}');
  const tour    = TOURS[user.rol] || TOURS.cliente;
  const Icon    = tour.icon;
  const current = tour.steps[step];
  const total   = tour.steps.length;

  // Auto-mostrar en primer login
  useEffect(() => {
    const key = `tour_seen_${user.id}_v2`;
    if (!localStorage.getItem(key) && user.id) {
      setTimeout(() => setIsOpen(true), 800);
    }
  }, [user.id]);

  // Escuchar evento de repetición desde botón (?)
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setAnimKey(k => k + 1);
      setInteracted(false);
      setIsOpen(true);
    };
    window.addEventListener('start-tour', handler);
    return () => window.removeEventListener('start-tour', handler);
  }, []);

  const goTo = (newStep, dir = 'right') => {
    setAnimDir(dir);
    setAnimKey(k => k + 1);
    setStep(newStep);
    setInteracted(false);
  };

  const handleNext = () => {
    if (step < total - 1) goTo(step + 1, 'right');
    else closeTour();
  };

  const handlePrev = () => {
    if (step > 0) goTo(step - 1, 'left');
  };

  const closeTour = () => {
    localStorage.setItem(`tour_seen_${user.id}_v2`, 'true');
    setIsOpen(false);
    setTimeout(() => { setStep(0); setInteracted(false); }, 500);
  };

  if (!isOpen) return null;

  const isInteractive = current.interactive;
  const canAdvance    = !isInteractive || interacted;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(6,4,2,0.92)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, animation: 'tourFadeIn 0.4s ease',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #1c1008 0%, #0f0905 100%)',
        border: `1px solid ${tour.color}30`,
        borderRadius: 22, width: '100%', maxWidth: 480,
        boxShadow: `0 24px 80px ${tour.color}20`,
        overflow: 'hidden',
        animation: 'tourSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
      }}>
        {/* Barra superior decorativa */}
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, ${tour.color}, var(--accent), var(--green))`,
        }} />

        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${tour.color}18, transparent)`,
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${tour.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `${tour.color}20`, border: `1px solid ${tour.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} color={tour.color} />
            </div>
            <div>
              <p style={{ fontSize: 12, color: tour.color, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Guía de inicio
              </p>
              <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
                {tour.title}
              </p>
            </div>
          </div>
          <button onClick={closeTour} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text-muted)', borderRadius: 8, padding: '6px 10px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={12} /> Saltar todo
          </button>
        </div>

        {/* Indicador de progreso */}
        <div style={{ padding: '12px 24px 0', display: 'flex', gap: 5 }}>
          {tour.steps.map((_, i) => (
            <div key={i} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: i < step
                ? tour.color
                : i === step
                  ? `${tour.color}80`
                  : 'rgba(255,255,255,0.1)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Cuerpo del paso */}
        <div
          key={animKey}
          style={{
            padding: '20px 24px',
            animation: `${animDir === 'right' ? 'slideInRight' : 'slideInLeft'} 0.35s cubic-bezier(0.16, 1, 0.3, 1)`,
          }}
        >
          {/* Emoji + título */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 28, lineHeight: 1 }}>{current.emoji}</span>
            <h2 style={{
              fontSize: 20, color: 'var(--text)',
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 600,
            }}>
              {current.title}
            </h2>
          </div>

          {/* Descripción */}
          <p style={{
            fontSize: 14, color: 'var(--text-muted)',
            lineHeight: 1.7, marginBottom: 18,
          }}>
            {current.desc}
          </p>

          {/* Visual / Demo */}
          <div style={{ marginBottom: 18 }}>
            <StepVisual
              step={current}
              onInteractionDone={() => setInteracted(true)}
            />
          </div>

          {/* Hint de interacción */}
          {isInteractive && !interacted && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 8, marginBottom: 12,
              background: `${tour.color}10`,
              border: `1px solid ${tour.color}25`,
              animation: 'breathe 2s ease-in-out infinite',
            }}>
              <Play size={12} color={tour.color} />
              <p style={{ fontSize: 12, color: tour.color }}>
                Pruébalo tú mismo — arrastra la tarjeta de arriba
              </p>
            </div>
          )}

          {isInteractive && interacted && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 8, marginBottom: 12,
              background: 'rgba(74,139,92,0.1)',
              border: '1px solid rgba(74,139,92,0.3)',
              animation: 'fadeIn 0.4s ease',
            }}>
              <CheckCircle size={12} color="var(--green)" />
              <p style={{ fontSize: 12, color: 'var(--green)' }}>¡Perfecto! Ya sabes cómo hacerlo.</p>
            </div>
          )}
        </div>

        {/* Navegación */}
        <div style={{
          padding: '0 24px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Botón anterior */}
          <button
            onClick={handlePrev}
            disabled={step === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '8px 14px', borderRadius: 9,
              background: step === 0 ? 'transparent' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${step === 0 ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
              color: step === 0 ? 'transparent' : 'var(--text-muted)',
              fontSize: 13, cursor: step === 0 ? 'default' : 'pointer',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { if (step > 0) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}}
            onMouseLeave={e => { e.currentTarget.style.color = step === 0 ? 'transparent' : 'var(--text-muted)'; e.currentTarget.style.background = step === 0 ? 'transparent' : 'rgba(255,255,255,0.05)'; }}
          >
            <ArrowLeft size={14} /> Anterior
          </button>

          {/* Paso actual */}
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            {step + 1} de {total}
          </span>

          {/* Botón siguiente / finalizar */}
          <button
            onClick={handleNext}
            disabled={isInteractive && !interacted}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 20px', borderRadius: 9, border: 'none',
              background: (!isInteractive || interacted)
                ? (step < total - 1
                    ? `linear-gradient(135deg, ${tour.color}, ${tour.color}90)`
                    : 'linear-gradient(135deg, var(--green), #3a7a50)')
                : 'var(--surface3)',
              color: (!isInteractive || interacted) ? '#fff' : 'var(--text-dim)',
              fontWeight: 600, fontSize: 13,
              cursor: (!isInteractive || interacted) ? 'pointer' : 'not-allowed',
              boxShadow: (!isInteractive || interacted) ? `0 4px 16px ${tour.color}35` : 'none',
              transition: 'all 0.2s',
            }}
          >
            {step < total - 1 ? (
              <> {isInteractive && !interacted ? 'Interactúa primero' : 'Siguiente'} <ArrowRight size={14} /></>
            ) : (
              <><CheckCircle size={14} /> ¡Listo!</>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tourFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tourSlideUp { from { opacity: 0; transform: scale(0.94) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes slideInRight{ from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn      { from { opacity: 0; } to { opacity: 1; } }
        @keyframes breathe     { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}