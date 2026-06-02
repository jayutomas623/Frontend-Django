// src/components/RecommendationsBlock.jsx
// Módulo 4 — Bloque "Para Ti" y Promociones en el Menú
// Se integra en la parte superior del menú del cliente
import { useState, useEffect } from 'react';
import { Sparkles, Star, Plus, Minus, TrendingUp, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { useCart } from '../context/CartContext';

// ── Tarjeta de producto recomendado ─────────────────────────────────────────
function RecoCard({ producto }) {
  const { items, addItem, removeItem } = useCart();
  const inCart = items.find(i => i.id === producto.id);

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      flexShrink: 0,
      width: 170,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Imagen */}
      {producto.imagen ? (
        <img src={producto.imagen} alt={producto.nombre} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
      ) : (
        <div style={{ height: 100, background: 'linear-gradient(135deg, var(--surface2), var(--surface3))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 32, opacity: 0.4 }}>🍽️</span>
        </div>
      )}

      <div style={{ padding: '10px 12px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {producto.nombre}
        </p>
        <p style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700, fontFamily: 'Cormorant Garamond, serif', marginBottom: 8 }}>
          Bs. {Number(producto.precio).toFixed(2)}
        </p>

        {inCart ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <button
              onClick={() => removeItem(producto.id)}
              style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Minus size={11} />
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-light)', flex: 1, textAlign: 'center' }}>
              {inCart.cantidad}
            </span>
            <button
              onClick={() => addItem(producto)}
              style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--accent)', color: '#f0e4d2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}
            >
              <Plus size={11} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => addItem(producto)}
            style={{
              width: '100%', padding: '6px', borderRadius: 6, border: 'none',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
              color: '#f0e4d2', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            <Plus size={11} /> Agregar
          </button>
        )}
      </div>
    </div>
  );
}

// ── Tarjeta de promoción ─────────────────────────────────────────────────────
function PromoCard({ promo }) {
  const { addItem } = useCart();

  const handleAddCombo = () => {
    if (promo.producto_principal_data) {
      addItem(promo.producto_principal_data);
      // Registrar conversión
      api.patch(`/recommendations/promociones/${promo.id}/registrar_conversion/`).catch(() => {});
    }
    if (promo.producto_secundario_data) {
      addItem(promo.producto_secundario_data);
    }
  };

  // Registrar vista al montar
  useEffect(() => {
    api.patch(`/recommendations/promociones/${promo.id}/registrar_vista/`).catch(() => {});
  }, [promo.id]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(207,100,48,0.12), rgba(224,168,48,0.06))',
      border: '1px solid rgba(207,100,48,0.35)',
      borderRadius: 14,
      padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      flexShrink: 0, maxWidth: 380,
    }}>
      {/* Tipo */}
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: 'rgba(207,100,48,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>
        {promo.tipo === 'combo' ? '🔗' : promo.tipo === 'destacado' ? '⭐' : '💸'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {promo.descuento_pct > 0 && (
            <span style={{ fontSize: 10, fontWeight: 800, color: '#f0e4d2', background: 'var(--accent)', padding: '2px 7px', borderRadius: 6 }}>
              -{promo.descuento_pct}%
            </span>
          )}
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {promo.titulo}
          </p>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {promo.descripcion.substring(0, 80)}...
        </p>
      </div>

      <button
        onClick={handleAddCombo}
        style={{
          flexShrink: 0, padding: '8px 14px', borderRadius: 8, border: 'none',
          background: 'var(--accent)', color: '#f0e4d2',
          fontSize: 11, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        <Plus size={12} /> Pedir
      </button>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function RecommendationsBlock() {
  const [recos,      setRecos]      = useState(null);
  const [promos,     setPromos]     = useState([]);
  const [loadingR,   setLoadingR]   = useState(true);
  const [loadingP,   setLoadingP]   = useState(true);
  const [showSection, setShowSection] = useState(true);

  useEffect(() => {
    // Recomendaciones personalizadas
    api.get('/recommendations/for-me/')
      .then(r => setRecos(r.data))
      .catch(() => setRecos(null))
      .finally(() => setLoadingR(false));

    // Promociones activas
    api.get('/recommendations/promociones-activas/')
      .then(r => setPromos(r.data))
      .catch(() => setPromos([]))
      .finally(() => setLoadingP(false));
  }, []);

  const tieneContenido = (
    (recos && recos.productos && recos.productos.length > 0) ||
    promos.length > 0
  );

  if ((loadingR && loadingP)) {
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ height: 180, borderRadius: 14, background: 'var(--surface)', animation: 'pulse 1.5s infinite' }} />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  if (!tieneContenido) return null;

  return (
    <div style={{ marginBottom: 28, animation: 'fadeUp 0.4s ease' }}>

      {/* ── Sección "Para Ti" ── */}
      {recos && recos.productos && recos.productos.length > 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '18px 20px',
          marginBottom: 16,
        }}>
          {/* Encabezado */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {recos.tipo === 'personalizado'
                  ? <Star size={15} color="#f0e4d2" />
                  : <TrendingUp size={15} color="#f0e4d2" />
                }
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
                  {recos.tipo === 'personalizado' ? '✨ Para ti' : '🔥 Los más pedidos'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {recos.tipo === 'personalizado'
                    ? 'Basado en tu historial de pedidos'
                    : 'Los favoritos del restaurante'}
                </p>
              </div>
            </div>
          </div>

          {/* Scroll horizontal de tarjetas */}
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6,
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}>
            {recos.productos.map(p => (
              <RecoCard key={p.id} producto={p} />
            ))}
          </div>
        </div>
      )}

      {/* ── Sección de Promociones ── */}
      {promos.length > 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid rgba(207,100,48,0.2)',
          borderRadius: 16,
          padding: '18px 20px',
        }}>
          {/* Encabezado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={15} color="#1a1108" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
                Ofertas especiales
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Combos y descuentos de hoy
              </p>
            </div>
          </div>

          {/* Scroll horizontal de promos */}
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6,
            scrollbarWidth: 'none',
          }}>
            {promos.map(promo => (
              <PromoCard key={promo.id} promo={promo} />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}