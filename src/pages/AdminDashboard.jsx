// C:\laragon\www\Proyecto-Django\frontend\src\pages\AdminDashboard.jsx
// Sprint 4 — Dashboard con datos reales, Recharts + mapa de calor D3
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  LayoutDashboard, TrendingUp, DollarSign, ShoppingBag,
  CheckCircle, Flame, XCircle, Clock, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import * as d3 from 'd3';
import api from '../api/axios';

// ── Tooltip personalizado para Recharts ──────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(20,13,8,0.96)', border: '1px solid var(--border-hi)',
      borderRadius: 8, padding: '10px 14px',
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || 'var(--gold)', fontWeight: 700, fontSize: 14 }}>
          {p.name === 'total' ? `Bs. ${Number(p.value).toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Mapa de calor D3 ─────────────────────────────────────────────────────────
function HeatmapD3({ data }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;

    const DIAS   = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const HORAS  = Array.from({ length: 24 }, (_, i) => i);

    const el     = ref.current;
    const W      = el.clientWidth  || 700;
    const H      = 220;
    const margin = { top: 20, right: 20, bottom: 40, left: 42 };
    const iW     = W - margin.left - margin.right;
    const iH     = H - margin.top  - margin.bottom;

    d3.select(el).selectAll('*').remove();

    const svg = d3.select(el)
      .append('svg')
      .attr('width', W).attr('height', H)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(HORAS).range([0, iW]).padding(0.05);
    const y = d3.scaleBand().domain([0, 1, 2, 3, 4, 5, 6]).range([0, iH]).padding(0.05);

    const maxVal = d3.max(data, d => d.count) || 1;
    const color  = d3.scaleSequential()
      .domain([0, maxVal])
      .interpolator(d3.interpolateRgb('rgba(207,100,48,0.05)', 'rgba(207,100,48,0.95)'));

    // Celdas
    svg.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x',      d => x(d.hora))
      .attr('y',      d => y(d.dia))
      .attr('width',  x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('rx', 3)
      .attr('fill', d => color(d.count))
      .append('title')
      .text(d => `${DIAS[d.dia]} ${d.hora}:00 — ${d.count} pedidos`);

    // Eje X (horas)
    svg.append('g')
      .attr('transform', `translate(0,${iH})`)
      .call(
        d3.axisBottom(x)
          .tickValues([0, 3, 6, 9, 12, 15, 18, 21])
          .tickFormat(h => `${h}:00`)
      )
      .call(g => {
        g.select('.domain').remove();
        g.selectAll('line').remove();
        g.selectAll('text')
          .style('fill', 'rgba(180,160,140,0.6)')
          .style('font-size', '10px');
      });

    // Eje Y (días)
    svg.append('g')
      .call(d3.axisLeft(y).tickFormat(i => DIAS[i]))
      .call(g => {
        g.select('.domain').remove();
        g.selectAll('line').remove();
        g.selectAll('text')
          .style('fill', 'rgba(180,160,140,0.7)')
          .style('font-size', '11px');
      });
  }, [data, ref.current?.clientWidth]);

  return (
    <div ref={ref} style={{ width: '100%', minHeight: 220 }} />
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null);
  const [weekly,   setWeekly]   = useState([]);
  const [heatmap,  setHeatmap]  = useState([]);
  const [topProds, setTopProds] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [lastUpd,  setLastUpd]  = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, w, h, t] = await Promise.all([
        api.get('/orders/stats/dashboard/'),
        api.get('/orders/stats/weekly/'),
        api.get('/orders/stats/heatmap/'),
        api.get('/orders/stats/top-products/'),
      ]);
      setStats(s.data);
      setWeekly(w.data);
      setHeatmap(h.data);
      setTopProds(t.data);
      setLastUpd(new Date());
    } catch (e) {
      console.error('Error cargando estadísticas:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '28px' }}>

      {/* HEADER */}
      <header style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fadeUp 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LayoutDashboard size={20} color="#f0e4d2" />
          </div>
          <div>
            <h2 style={{ fontSize: 26, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
              Dashboard Principal
            </h2>
            {lastUpd && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Actualizado: {lastUpd.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '9px 14px', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, cursor: 'pointer' }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Actualizar
        </button>
      </header>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard
          title="Ventas de Hoy"
          value={stats ? `Bs. ${stats.ventas_hoy.toFixed(2)}` : '…'}
          icon={DollarSign} color="var(--gold)"
          loading={loading}
        />
        <StatCard
          title="Pedidos Entregados"
          value={stats?.pedidos_completados ?? '…'}
          icon={CheckCircle} color="var(--green)"
          loading={loading}
        />
        <StatCard
          title="Pedidos Activos"
          value={stats?.pedidos_activos ?? '…'}
          icon={Clock} color="var(--accent-light)"
          loading={loading}
        />
        <StatCard
          title="Cancelados Hoy"
          value={stats?.pedidos_cancelados ?? '…'}
          icon={XCircle} color="var(--danger)"
          loading={loading}
        />
        <StatCard
          title="Producto Estrella"
          value={stats?.top_producto ?? '…'}
          icon={Flame} color="var(--gold)"
          loading={loading}
          small
        />
      </div>

      {/* FILA 1: Gráfico de ventas + Top productos */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Ventas semanales — Recharts AreaChart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, animation: 'fadeUp 0.4s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ color: 'var(--text)', fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="var(--accent)" /> Ventas — Últimos 7 días
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weekly} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="dia" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `Bs.${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" name="total" stroke="var(--accent)" strokeWidth={2} fill="url(#gradVentas)" dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Productos */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, animation: 'fadeUp 0.5s ease' }}>
          <h3 style={{ color: 'var(--text)', fontSize: 17, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <ShoppingBag size={18} color="var(--gold)" /> Productos Top
          </h3>
          {loading ? (
            <SkeletonList rows={5} />
          ) : topProds.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin datos todavía.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topProds.map((prod, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: 'var(--surface2)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--accent-light)', fontWeight: 700 }}>
                      {i + 1}
                    </span>
                    <div>
                      <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{prod.nombre}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{prod.total_vendido} vendidos</p>
                    </div>
                  </div>
                  <span style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: 'Cormorant Garamond, serif', fontSize: 15 }}>
                    Bs. {prod.precio.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FILA 2: Pedidos por día (barras) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, animation: 'fadeUp 0.45s ease' }}>
          <h3 style={{ color: 'var(--text)', fontSize: 17, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <CheckCircle size={18} color="var(--green)" /> Pedidos por día
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekly} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="dia" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pedidos" name="pedidos" fill="var(--green)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mini stats extras */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, animation: 'fadeUp 0.5s ease' }}>
          <h3 style={{ color: 'var(--text)', fontSize: 17, marginBottom: 20 }}>Resumen de la semana</h3>
          {loading ? <SkeletonList rows={4} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Total recaudado',       value: `Bs. ${weekly.reduce((a, d) => a + d.total, 0).toFixed(2)}`,   color: 'var(--gold)' },
                { label: 'Total pedidos',          value: weekly.reduce((a, d) => a + d.pedidos, 0),                     color: 'var(--green)' },
                { label: 'Promedio diario',        value: `Bs. ${(weekly.reduce((a, d) => a + d.total, 0) / 7).toFixed(2)}`, color: 'var(--accent-light)' },
                { label: 'Mejor día',              value: weekly.reduce((best, d) => d.total > best.total ? d : best, weekly[0] || {})?.dia || '—', color: 'var(--accent)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface2)', borderRadius: 9 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
                  <span style={{ color, fontWeight: 700, fontFamily: 'Cormorant Garamond, serif', fontSize: 16 }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FILA 3: Mapa de calor D3 */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, animation: 'fadeUp 0.55s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: 'var(--text)', fontSize: 17 }}>
            🔥 Mapa de calor — Horas pico (últimas 4 semanas)
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Menos</span>
            {[0.05, 0.25, 0.5, 0.75, 0.95].map((o, i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: `rgba(207,100,48,${o})` }} />
            ))}
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Más</span>
          </div>
        </div>
        {loading ? (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cargando datos...</p>
          </div>
        ) : heatmap.length === 0 ? (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin datos suficientes aún. Los pedidos aparecerán aquí.</p>
          </div>
        ) : (
          <HeatmapD3 data={heatmap} />
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color, loading, small }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, display: 'flex', alignItems: 'center', gap: 14, animation: 'fadeUp 0.3s ease' }}>
      <div style={{ width: 46, height: 46, borderRadius: 11, background: `color-mix(in srgb, ${color} 14%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 3 }}>{title}</p>
        {loading ? (
          <div style={{ height: 28, width: 80, borderRadius: 6, background: 'var(--surface3)', animation: 'pulse 1.5s infinite' }} />
        ) : (
          <p style={{ color: 'var(--text)', fontSize: small ? 15 : 22, fontWeight: 700, fontFamily: 'Cormorant Garamond, serif', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function SkeletonList({ rows }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ height: 44, borderRadius: 9, background: 'var(--surface3)', animation: 'pulse 1.5s infinite', animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}