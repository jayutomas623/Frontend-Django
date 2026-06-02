// frontend/src/pages/Menu.jsx
// Cambios: detecta ?mesa= en URL, muestra banner de mesa, sets mesaActual en context
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, Plus, Search, X, Minus, MapPin, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import RecommendationsBlock from '../components/RecommendationsBlock';

export default function Menu() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch]         = useState('');
  const [mesaInfo, setMesaInfo]     = useState(null); // datos de la mesa del QR
  const { items, addItem, removeItem, total, mesaActual, setMesaActual } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Detectar mesa desde QR ──────────────────────────────────────
  useEffect(() => {
    const mesaParam = searchParams.get('mesa');
    if (mesaParam) {
      api.get('/mesas/mesas/')
        .then(r => {
          const mesa = r.data.find(m => m.numero === parseInt(mesaParam));
          if (mesa) {
            setMesaInfo(mesa);
            setMesaActual({ id: mesa.id, numero: mesa.numero });
          }
        })
        .catch(() => {});
    }
  }, []);

  // ── Datos del menú ───────────────────────────────────────────────
  useEffect(() => {
    api.get('/menu/categories/').then(r => setCategories(r.data));
  }, []);

  useEffect(() => {
    const url = selectedCat
      ? `/menu/products/?categoria=${selectedCat}`
      : '/menu/products/';
    api.get(url).then(r => setProducts(r.data));
  }, [selectedCat]);

  const filtered  = products.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );
  const cartCount = items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(12,8,6,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 62,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--accent), var(--gold), var(--green))' }} />
        <span style={{ fontSize: 20 }}>🍽️</span>
        <h2 style={{ fontSize: 22, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
          Nuestro Menú
        </h2>
      </header>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 28px 100px' }}>

        {/* Banner de mesa detectada por QR */}
        {mesaActual && mesaInfo && (
          <div style={{
            background: 'rgba(74,139,92,0.1)', border: '1px solid rgba(74,139,92,0.35)',
            borderRadius: 12, padding: '12px 18px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            animation: 'fadeUp 0.4s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={18} color="var(--green)" />
              <div>
                <p style={{ fontSize: 14, color: 'var(--green)', fontWeight: 600 }}>
                  Estás en la Mesa {mesaActual.numero}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Tu pedido se entregará directamente en tu mesa · Capacidad: {mesaInfo.capacidad} personas
                </p>
              </div>
            </div>
            <button
              onClick={() => { setMesaActual(null); setMesaInfo(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 22 }}>
          <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            style={{ paddingLeft: 40, background: 'var(--surface)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)', padding: 4 }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/*Recomendaciones y promociones */}
        <RecommendationsBlock />

        {/* Categorías */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 26 }}>
          {['', ...categories.map(c => c.id)].map((id, idx) => {
            const label  = id === '' ? 'Todos' : categories.find(c => c.id === id)?.nombre;
            const active = selectedCat === id;
            return (
              <button key={idx} onClick={() => setSelectedCat(id)} style={{
                padding: '7px 18px', borderRadius: 22,
                background: active
                  ? 'linear-gradient(135deg, var(--accent), var(--accent-dim))'
                  : 'var(--surface)',
                color: active ? '#f0e4d2' : 'var(--text-muted)',
                border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
                fontWeight: active ? 600 : 400, fontSize: 13,
                transition: 'all 0.18s',
                boxShadow: active ? '0 3px 12px rgba(207,100,48,0.25)' : 'none',
              }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Grid de productos */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🍴</div>
            <p style={{ fontSize: 16 }}>No hay productos disponibles.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
            {filtered.map((p, index) => {
              const inCart = items.find(i => i.id === p.id);
              return (
                <div
                  key={p.id}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 14, overflow: 'hidden',
                    transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                    animation: `fadeUp 0.3s ease ${index * 0.04}s both`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hi)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Imagen */}
                  {p.imagen ? (
                    <div style={{ position: 'relative' }}>
                      <img src={p.imagen} alt={p.nombre} style={{ width: '100%', height: 148, objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to top, rgba(26,17,11,0.7), transparent)' }} />
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: 148, background: 'linear-gradient(135deg, var(--surface2), var(--surface3))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 42, opacity: 0.4 }}>🍽️</span>
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ padding: 15 }}>
                    <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 5, color: 'var(--text)', lineHeight: 1.3 }}>
                      {p.nombre}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.descripcion || 'Sin descripción'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 16, fontFamily: 'Cormorant Garamond, serif' }}>
                        Bs. {Number(p.precio).toFixed(2)}
                      </span>
                      {inCart ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <button onClick={() => removeItem(p.id)} style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-light)', minWidth: 18, textAlign: 'center' }}>
                            {inCart.cantidad}
                          </span>
                          <button onClick={() => addItem(p)} style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--accent)', color: '#f0e4d2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 2px 8px rgba(207,100,48,0.3)' }}>
                            <Plus size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => addItem(p)} style={{ padding: '7px 13px', borderRadius: 7, background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))', color: '#f0e4d2', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, border: 'none', boxShadow: '0 2px 8px rgba(207,100,48,0.25)' }}>
                          <Plus size={13} strokeWidth={2.5} /> Agregar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Carrito flotante */}
      {items.length > 0 && (
        <div
          onClick={() => navigate('/checkout')}
          style={{
            position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
            color: '#f0e4d2', padding: '14px 28px', borderRadius: 44,
            boxShadow: '0 8px 32px rgba(207,100,48,0.45)',
            display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer', zIndex: 200, whiteSpace: 'nowrap',
            animation: 'fadeUp 0.3s ease',
          }}
        >
          {mesaActual && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, background: 'rgba(0,0,0,0.2)', padding: '3px 8px', borderRadius: 10 }}>
              <MapPin size={10} /> Mesa {mesaActual.numero}
            </span>
          )}
          <div style={{ background: 'rgba(0,0,0,0.25)', color: '#f0e4d2', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
            {cartCount}
          </div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Ver pedido</span>
          <span style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Cormorant Garamond, serif' }}>
            Bs. {total.toFixed(2)}
          </span>
          <ShoppingCart size={17} />
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
