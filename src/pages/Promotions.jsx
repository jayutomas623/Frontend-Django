// src/pages/Promotions.jsx
// Módulo 4 — Panel de Promociones para Administrador
// Análisis ML global, aprobación/rechazo, métricas de efectividad
import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, RefreshCw, CheckCircle, X, TrendingUp,
  BarChart2, Star, Zap, Eye, ShoppingCart, AlertCircle,
  Play, ChevronDown, ChevronUp,
} from 'lucide-react';
import api from '../api/axios';

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: 'var(--gold)',         bg: 'rgba(224,168,48,0.12)'  },
  aprobada:   { label: 'Activa',     color: 'var(--green)',        bg: 'rgba(74,139,92,0.12)'   },
  rechazada:  { label: 'Rechazada',  color: 'var(--danger)',       bg: 'rgba(201,92,92,0.12)'   },
  expirada:   { label: 'Expirada',   color: 'var(--text-muted)',   bg: 'var(--surface2)'        },
};

const TIPO_ICON = {
  combo:     '🔗',
  descuento: '💸',
  destacado: '⭐',
};

function ScoreBar({ score }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--gold)' : 'var(--accent)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--surface3)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

function PromoCard({ promo, onAprobar, onRechazar, onExpand, expanded }) {
  const estado = ESTADO_CONFIG[promo.estado] || ESTADO_CONFIG.pendiente;
  const isPendiente = promo.estado === 'pendiente';

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${isPendiente ? 'rgba(224,168,48,0.35)' : 'var(--border)'}`,
      borderRadius: 14,
      overflow: 'hidden',
      animation: 'fadeUp 0.35s ease',
      boxShadow: isPendiente ? '0 4px 20px rgba(224,168,48,0.1)' : 'none',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        background: isPendiente ? 'rgba(224,168,48,0.05)' : 'var(--surface2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{TIPO_ICON[promo.tipo] || '🎯'}</span>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: 14, fontWeight: 700, color: 'var(--text)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {promo.titulo}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                color: estado.color, background: estado.bg,
              }}>
                {estado.label}
              </span>
              {promo.generada_por_ml && (
                <span style={{ fontSize: 10, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Sparkles size={9} /> ML
                </span>
              )}
              {promo.descuento_pct > 0 && (
                <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700 }}>
                  -{promo.descuento_pct}%
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isPendiente && (
            <>
              <button
                onClick={() => onAprobar(promo.id)}
                style={{
                  padding: '6px 12px', borderRadius: 7, border: 'none',
                  background: 'linear-gradient(135deg, var(--green), #3a7a50)',
                  color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  boxShadow: '0 2px 8px rgba(74,139,92,0.35)',
                }}
              >
                <CheckCircle size={12} /> Aprobar
              </button>
              <button
                onClick={() => onRechazar(promo.id)}
                style={{
                  padding: '6px 10px', borderRadius: 7,
                  border: '1px solid rgba(201,92,92,0.4)',
                  background: 'rgba(201,92,92,0.08)',
                  color: 'var(--danger)', fontSize: 11, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <X size={12} />
              </button>
            </>
          )}
          <button
            onClick={() => onExpand(promo.id)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expandido */}
      {expanded && (
        <div style={{ padding: '14px 18px' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
            {promo.descripcion}
          </p>

          {/* Productos */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {promo.producto_principal_data && (
              <div style={{
                flex: 1, minWidth: 130,
                background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px',
                border: '1px solid var(--border)',
              }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>PRODUCTO PRINCIPAL</p>
                <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                  {promo.producto_principal_data.nombre}
                </p>
                <p style={{ fontSize: 12, color: 'var(--gold)', marginTop: 2 }}>
                  Bs. {Number(promo.producto_principal_data.precio).toFixed(2)}
                </p>
              </div>
            )}
            {promo.producto_secundario_data && (
              <div style={{
                flex: 1, minWidth: 130,
                background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px',
                border: '1px solid var(--border)',
              }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>PRODUCTO COMBO</p>
                <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                  {promo.producto_secundario_data.nombre}
                </p>
                <p style={{ fontSize: 12, color: 'var(--gold)', marginTop: 2 }}>
                  Bs. {Number(promo.producto_secundario_data.precio).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Score ML */}
          {promo.generada_por_ml && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                Confianza del modelo ML
              </p>
              <ScoreBar score={promo.score_ml} />
            </div>
          )}

          {/* Métricas de efectividad */}
          {promo.estado === 'aprobada' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{
                flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Eye size={14} color="var(--text-muted)" />
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-light)', fontFamily: 'Cormorant Garamond, serif' }}>
                    {promo.vistas}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Vistas</p>
                </div>
              </div>
              <div style={{
                flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <ShoppingCart size={14} color="var(--text-muted)" />
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)', fontFamily: 'Cormorant Garamond, serif' }}>
                    {promo.conversiones}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Conversiones</p>
                </div>
              </div>
              <div style={{
                flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <TrendingUp size={14} color="var(--text-muted)" />
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', fontFamily: 'Cormorant Garamond, serif' }}>
                    {promo.tasa_conversion}%
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Tasa</p>
                </div>
              </div>
            </div>
          )}

          {promo.aprobada_por_nombre && (
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 10 }}>
              Aprobada por: {promo.aprobada_por_nombre}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Promotions() {
  const [promos,      setPromos]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [filterEstado, setFilterEstado] = useState('');
  const [expandedId,  setExpandedId]  = useState(null);
  const [flash,       setFlash]       = useState(null);
  const [lastResult,  setLastResult]  = useState(null);

  const showFlash = (text, ok = true) => {
    setFlash({ text, ok });
    setTimeout(() => setFlash(null), 4000);
  };

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterEstado
        ? `/recommendations/promociones/?estado=${filterEstado}`
        : '/recommendations/promociones/';
      const r = await api.get(url);
      setPromos(r.data);
    } catch {
      showFlash('Error al cargar promociones.', false);
    } finally {
      setLoading(false);
    }
  }, [filterEstado]);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const r = await api.post('/recommendations/analyze-global/');
      setLastResult(r.data);
      showFlash(`✅ ${r.data.generadas} promociones generadas por el modelo ML.`);
      fetchPromos();
    } catch (e) {
      const msg = e.response?.data?.detail || 'No hay suficientes datos para analizar.';
      showFlash(msg, false);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAprobar = async (id) => {
    try {
      await api.patch(`/recommendations/promociones/${id}/aprobar/`);
      showFlash('✅ Promoción aprobada. Ahora es visible en el menú.');
      fetchPromos();
    } catch {
      showFlash('Error al aprobar.', false);
    }
  };

  const handleRechazar = async (id) => {
    try {
      await api.patch(`/recommendations/promociones/${id}/rechazar/`);
      showFlash('Promoción rechazada.');
      fetchPromos();
    } catch {
      showFlash('Error al rechazar.', false);
    }
  };

  const pendientes = promos.filter(p => p.estado === 'pendiente').length;
  const aprobadas  = promos.filter(p => p.estado === 'aprobada').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 28 }}>

      {/* Header */}
      <header style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, animation: 'fadeUp 0.3s ease' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="#f0e4d2" />
            </div>
            <h2 style={{ fontSize: 26, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
              Promociones Inteligentes
            </h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 480 }}>
            El sistema analiza los patrones de venta y genera sugerencias de combos y destacados.
            Aprueba las que quieras publicar en el menú del cliente.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button
            onClick={fetchPromos}
            disabled={loading}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '9px 14px', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            style={{
              padding: '10px 20px', borderRadius: 9, border: 'none',
              background: analyzing
                ? 'var(--surface3)'
                : 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
              color: analyzing ? 'var(--text-muted)' : '#f0e4d2',
              fontWeight: 600, fontSize: 13, cursor: analyzing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: analyzing ? 'none' : '0 4px 16px rgba(207,100,48,0.3)',
            }}
          >
            {analyzing
              ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analizando...</>
              : <><Zap size={14} /> Analizar con ML</>
            }
          </button>
        </div>
      </header>

      {/* Flash */}
      {flash && (
        <div style={{
          padding: '12px 18px', borderRadius: 10, marginBottom: 20, fontSize: 13,
          background: flash.ok ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: flash.ok ? 'var(--success)' : 'var(--danger)',
          border: flash.ok ? '1px solid rgba(90,184,125,0.3)' : '1px solid rgba(201,92,92,0.3)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertCircle size={15} />
          {flash.text}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Pendientes',   value: pendientes,                        color: 'var(--gold)',         icon: '⏳' },
          { label: 'Activas',      value: aprobadas,                         color: 'var(--green)',        icon: '✅' },
          { label: 'Total',        value: promos.length,                     color: 'var(--accent-light)', icon: '📊' },
          { label: 'Conversiones', value: promos.reduce((a, p) => a + p.conversiones, 0), color: 'var(--accent)', icon: '🛒' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <div>
              <p style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'Cormorant Garamond, serif', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Resultado del último análisis ML */}
      {lastResult && (
        <div style={{
          background: 'rgba(207,100,48,0.06)', border: '1px solid rgba(207,100,48,0.25)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <Sparkles size={16} color="var(--accent)" />
          <p style={{ fontSize: 13, color: 'var(--accent-light)', fontWeight: 600 }}>
            Último análisis ML
          </p>
          {[
            ['Productos analizados', lastResult.resumen?.total_productos_analizados],
            ['Muy vendidos', lastResult.resumen?.muy_vendidos],
            ['Poco vendidos', lastResult.resumen?.poco_vendidos],
            ['Generadas', lastResult.generadas],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', flex: 1, minWidth: 100, gap: 6, alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}:</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{val ?? '—'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: '',           label: 'Todas' },
          { id: 'pendiente',  label: '⏳ Pendientes' },
          { id: 'aprobada',   label: '✅ Activas' },
          { id: 'rechazada',  label: '❌ Rechazadas' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilterEstado(id)}
            style={{
              padding: '7px 16px', borderRadius: 22, border: 'none',
              background: filterEstado === id
                ? 'linear-gradient(135deg, var(--accent), var(--accent-dim))'
                : 'var(--surface)',
              color: filterEstado === id ? '#f0e4d2' : 'var(--text-muted)',
              border: `1px solid ${filterEstado === id ? 'transparent' : 'var(--border)'}`,
              fontSize: 13, cursor: 'pointer', fontWeight: filterEstado === id ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de promociones */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 14, background: 'var(--surface)', animation: 'pulse 1.5s infinite', animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : promos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', opacity: 0.5 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🤖</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 8 }}>
            No hay promociones {filterEstado ? `con estado "${filterEstado}"` : 'todavía'}
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>
            Haz clic en <strong style={{ color: 'var(--accent)' }}>Analizar con ML</strong> para generar sugerencias automáticas
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {promos.map(promo => (
            <PromoCard
              key={promo.id}
              promo={promo}
              onAprobar={handleAprobar}
              onRechazar={handleRechazar}
              onExpand={(id) => setExpandedId(expandedId === id ? null : id)}
              expanded={expandedId === promo.id}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}