import { useEffect, useState, useCallback } from 'react';
import {
  MapPin, Users, CheckCircle, X, RefreshCw,
  Plus, Calendar, QrCode, Coffee, Unlock, Lock, Info,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';

const ESTADO = {
  libre:     { color: '#4a8b5c', glow: 'rgba(74,139,92,0.55)',  bg: 'rgba(74,139,92,0.13)',  label: 'Libre',     icon: '🟢' },
  ocupada:   { color: '#c95c5c', glow: 'rgba(201,92,92,0.55)', bg: 'rgba(201,92,92,0.13)',  label: 'Ocupada',   icon: '🔴' },
  reservada: { color: '#e0a830', glow: 'rgba(224,168,48,0.55)',bg: 'rgba(224,168,48,0.13)', label: 'Reservada', icon: '🟡' },
};

function Chairs({ cx, cy, tableW, tableH, count, color }) {
  const rx = tableW / 2 + 16;
  const ry = tableH / 2 + 16;
  return Array.from({ length: count }).map((_, i) => {
    const angle = ((i * 360) / count - 90) * (Math.PI / 180);
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    return (
      <ellipse key={i} cx={x} cy={y} rx={7} ry={5.5}
        transform={`rotate(${(i * 360) / count}, ${x}, ${y})`}
        fill={color} opacity={0.35}
      />
    );
  });
}

function MesaSVG({ mesa, selectedId, onClick }) {
  const cfg    = ESTADO[mesa.estado] || ESTADO.libre;
  const isOcup = mesa.estado === 'ocupada';
  const isSel  = selectedId === mesa.id;
  const w      = mesa.capacidad <= 2 ? 72 : mesa.capacidad <= 4 ? 92 : 114;
  const h      = 64;
  const cx     = mesa.pos_x + w / 2;
  const cy     = mesa.pos_y + h / 2;

  return (
    <g onClick={() => onClick(mesa)} style={{ cursor: 'pointer' }}>
      <rect x={mesa.pos_x - 6} y={mesa.pos_y - 6} width={w + 12} height={h + 12} rx={12}
        fill="none" stroke={cfg.color} strokeWidth={isSel ? 2.5 : 1}
        opacity={isSel ? 0.9 : isOcup ? 0.5 : 0.25}
        style={isOcup ? { animation: 'mesaPulse 2.4s ease-in-out infinite' } : undefined}
      />
      <Chairs cx={cx} cy={cy} tableW={w} tableH={h} count={mesa.capacidad} color={cfg.color} />
      <rect x={mesa.pos_x} y={mesa.pos_y} width={w} height={h} rx={8}
        fill={cfg.bg} stroke={cfg.color} strokeWidth={isSel ? 2 : 1.2}
      />
      <rect x={mesa.pos_x + 7} y={mesa.pos_y + 7} width={w - 14} height={h - 14} rx={4}
        fill="rgba(255,255,255,0.04)"
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={cfg.color} fontSize={18} fontWeight="800" fontFamily="Arial">
        {mesa.numero}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={cfg.color} fontSize={9.5} opacity={0.7} fontFamily="Arial">
        {mesa.capacidad} pers.
      </text>
    </g>
  );
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ background: `${color}12`, border: `1px solid ${color}35`, borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
      <p style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'Cormorant Garamond, serif', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{label}</p>
    </div>
  );
}

export default function TableMap() {
  const [mesas,       setMesas]       = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [msg,         setMsg]         = useState(null);
  const [showReserva, setShowReserva] = useState(false);
  const [showNueva,   setShowNueva]   = useState(false);
  const [reservaForm, setReservaForm] = useState({ fecha_reserva: '', notas: '' });
  const [nuevaForm,   setNuevaForm]   = useState({ numero: '', capacidad: 4 });
  const [submitting,  setSubmitting]  = useState(false);

  const user      = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin   = user.rol === 'admin';
  const isStaff   = ['cajero', 'cocina', 'admin'].includes(user.rol);
  const isCliente = user.rol === 'cliente';

  const mesaUrl = selected
    ? `${window.location.origin}/menu?mesa=${selected.numero}`
    : '';

  const fetchMesas = useCallback(async () => {
    try {
      const r = await api.get('/mesas/mesas/');
      setMesas(r.data);
      if (selected) {
        const upd = r.data.find(m => m.id === selected.id);
        if (upd) setSelected(upd);
      }
    } catch (e) {
      console.error('Error al cargar mesas:', e);
    } finally {
      setLoading(false);
    }
  }, [selected?.id]);

  useEffect(() => {
    fetchMesas();
    const iv = setInterval(fetchMesas, 15000);
    return () => clearInterval(iv);
  }, []);

  const flash = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleSetEstado = async (mesa, estado) => {
    try {
      await api.patch(`/mesas/mesas/${mesa.id}/set_estado/`, { estado });
      fetchMesas();
      flash(`Mesa ${mesa.numero} → ${ESTADO[estado].label}`);
    } catch {
      flash('Error al actualizar la mesa.', false);
    }
  };

  // ── Liberar mesa: válido para staff Y para clientes (con validación backend) ──
  const handleLiberarMesa = async (mesa) => {
    try {
      await api.patch(`/mesas/mesas/${mesa.id}/liberar/`);
      fetchMesas();
      flash(`Mesa ${mesa.numero} liberada. ¡Gracias!`);
    } catch (e) {
      const msg = e.response?.data?.detail || 'No puedes liberar esta mesa.';
      flash(msg, false);
    }
  };

  const handleSeed = async () => {
    try {
      await api.post('/mesas/mesas/seed/');
      fetchMesas();
      flash('Layout inicial de mesas creado correctamente.');
    } catch (e) {
      flash(e.response?.data?.detail || 'Error al crear mesas.', false);
    }
  };

  const handleReserva = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.post('/mesas/reservas/', {
        mesa:            selected.id,
        fecha_reserva:   reservaForm.fecha_reserva,
        notas:           reservaForm.notas,
        anticipo_pagado: 0,
      });
      fetchMesas();
      setShowReserva(false);
      setReservaForm({ fecha_reserva: '', notas: '' });
      flash(`Mesa ${selected.numero} reservada.`);
    } catch (e) {
      flash(e.response?.data?.detail || 'Error al reservar.', false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNuevaMesa = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/mesas/mesas/', {
        numero:    parseInt(nuevaForm.numero),
        capacidad: parseInt(nuevaForm.capacidad),
        pos_x:     60 + (mesas.length % 5) * 160,
        pos_y:     60 + Math.floor(mesas.length / 5) * 200,
      });
      fetchMesas();
      setShowNueva(false);
      setNuevaForm({ numero: '', capacidad: 4 });
      flash('Mesa creada correctamente.');
    } catch (e) {
      flash(e.response?.data?.detail || 'Error al crear mesa.', false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmarReserva = async (reservaId) => {
    try {
      await api.patch(`/mesas/reservas/${reservaId}/confirmar/`);
      fetchMesas();
      flash('Reserva activada. Mesa marcada como ocupada.');
    } catch (e) {
      flash(e.response?.data?.detail || 'Error.', false);
    }
  };

  const handleCancelarReserva = async (reservaId) => {
    try {
      await api.patch(`/mesas/reservas/${reservaId}/cancelar/`);
      fetchMesas();
      flash('Reserva cancelada. Mesa liberada.');
    } catch (e) {
      flash(e.response?.data?.detail || 'Error.', false);
    }
  };

  const stats = {
    total:      mesas.length,
    libres:     mesas.filter(m => m.estado === 'libre').length,
    ocupadas:   mesas.filter(m => m.estado === 'ocupada').length,
    reservadas: mesas.filter(m => m.estado === 'reservada').length,
  };

  const maxX = mesas.reduce((acc, m) => Math.max(acc, m.pos_x + 130), 700);
  const maxY = mesas.reduce((acc, m) => Math.max(acc, m.pos_y + 120), 520);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(12,8,6,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)', padding: '0 24px', height: 62,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--green), var(--gold), var(--accent))' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MapPin size={19} color="var(--green)" />
          <div>
            <h2 style={{ fontSize: 20, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.1 }}>
              Mapa del Restaurante
            </h2>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {isCliente ? 'Reserva de mesas' : 'Gestión de mesas y reservas'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {msg && (
            <span style={{
              fontSize: 12, padding: '5px 12px', borderRadius: 7,
              color: msg.ok ? 'var(--green)' : 'var(--danger)',
              background: msg.ok ? 'rgba(74,139,92,0.12)' : 'var(--danger-bg)',
              border: `1px solid ${msg.ok ? 'rgba(74,139,92,0.3)' : 'rgba(201,92,92,0.3)'}`,
              animation: 'fadeIn 0.3s ease',
            }}>
              {msg.text}
            </span>
          )}
          {isAdmin && mesas.length === 0 && !loading && (
            <button onClick={handleSeed} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))', color: '#f0e4d2', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={13} /> Crear layout inicial
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setShowNueva(true)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plus size={13} /> Mesa
            </button>
          )}
          <button onClick={fetchMesas} disabled={loading} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '7px 11px', borderRadius: 8, display: 'flex', cursor: 'pointer' }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 12, padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.015)' }}>
        <StatChip label="Total mesas"  value={stats.total}      color="var(--text-muted)" />
        <StatChip label="Libres"       value={stats.libres}     color="#4a8b5c" />
        <StatChip label="Ocupadas"     value={stats.ocupadas}   color="#c95c5c" />
        <StatChip label="Reservadas"   value={stats.reservadas} color="#e0a830" />
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
          {Object.entries(ESTADO).map(([k, v]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: v.color, display: 'inline-block' }} />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 310px', overflow: 'hidden' }}>

        {/* SVG Floor Plan */}
        <div style={{ padding: '20px', overflowY: 'auto' }}>
          {loading && mesas.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)', flexDirection: 'column', gap: 12 }}>
              <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', opacity: 0.4 }} />
              <p style={{ fontSize: 13 }}>Cargando mapa del restaurante...</p>
            </div>
          ) : mesas.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, flexDirection: 'column', gap: 16, opacity: 0.5 }}>
              <Coffee size={48} color="var(--text-muted)" />
              <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>No hay mesas configuradas</p>
              {isAdmin && (
                <button onClick={handleSeed} style={{ padding: '10px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Crear layout inicial (10 mesas)
                </button>
              )}
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Plano del restaurante — Click en una mesa para seleccionarla
              </p>
              <svg
                viewBox={`0 0 ${maxX + 40} ${maxY + 40}`}
                style={{ width: '100%', display: 'block', background: 'linear-gradient(135deg, #100a06, #0c0806)', borderRadius: 16, border: '1px solid var(--border)', cursor: 'default' }}
              >
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <rect x={20} y={20} width={maxX} height={maxY} rx={8} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} strokeDasharray="6 3" />
                <text x={14} y={maxY / 2 + 5} fontSize={8} fill="var(--accent)" opacity={0.5} textAnchor="middle" fontFamily="Arial">🚪</text>
                <rect x={maxX - 80} y={24} width={76} height={36} rx={4} fill="rgba(207,100,48,0.06)" stroke="rgba(207,100,48,0.2)" strokeWidth={1} />
                <text x={maxX - 42} y={46} fontSize={8} fill="var(--accent)" opacity={0.6} textAnchor="middle" fontFamily="Arial">BARRA</text>
                {mesas.map(mesa => (
                  <MesaSVG key={mesa.id} mesa={mesa} selectedId={selected?.id} onClick={setSelected} />
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div style={{ borderLeft: '1px solid var(--border)', overflowY: 'auto', background: 'rgba(15,9,5,0.6)' }}>
          {selected ? (
            <div style={{ padding: 20 }}>

              {/* Mesa header */}
              <div style={{
                background: `${ESTADO[selected.estado]?.bg || 'var(--surface)'}`,
                border: `1px solid ${ESTADO[selected.estado]?.color || 'var(--border)'}30`,
                borderRadius: 12, padding: '14px 16px', marginBottom: 16,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <h3 style={{ fontSize: 22, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif', marginBottom: 2 }}>
                    Mesa {selected.numero}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={12} />
                      {/* Edición de capacidad solo para admin */}
                      {isAdmin ? (
                        <input
                          type="number" min="1" max="20"
                          defaultValue={selected.capacidad}
                          key={selected.id}
                          onBlur={async (e) => {
                            const nueva = parseInt(e.target.value);
                            if (!nueva || nueva === selected.capacidad) return;
                            try {
                              await api.patch(`/mesas/mesas/${selected.id}/`, { capacidad: nueva });
                              fetchMesas();
                              flash(`Mesa ${selected.numero} → ${nueva} personas`);
                            } catch {
                              flash('Error al actualizar capacidad.', false);
                            }
                          }}
                          style={{ width: 48, padding: '2px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 12, textAlign: 'center' }}
                        />
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text)' }}>{selected.capacidad}</span>
                      )}
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>personas</span>
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, color: ESTADO[selected.estado]?.color, background: ESTADO[selected.estado]?.bg, border: `1px solid ${ESTADO[selected.estado]?.color}40` }}>
                      {ESTADO[selected.estado]?.label}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              {/* QR Code (solo staff) */}
              {isStaff && (
                <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16, border: '1px solid var(--border)', marginBottom: 14, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <QrCode size={12} /> QR de la mesa
                  </p>
                  <div style={{ background: '#fff', padding: 12, borderRadius: 10, display: 'inline-block', marginBottom: 8 }}>
                    <QRCodeSVG value={mesaUrl} size={150} fgColor="#1a1108" bgColor="#ffffff" />
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-dim)', wordBreak: 'break-all', lineHeight: 1.4 }}>{mesaUrl}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                    El cliente escanea este QR para abrir el menú en esta mesa
                  </p>
                </div>
              )}

              {/* Reserva activa — gestión solo para staff */}
              {selected.reserva_activa && (
                <div style={{ background: 'rgba(224,168,48,0.08)', border: '1px solid rgba(224,168,48,0.3)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={12} /> Reserva activa
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>{selected.reserva_activa.cliente}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: isStaff ? 8 : 0 }}>
                    Estado: <strong>{selected.reserva_activa.estado}</strong>
                  </p>
                  {isStaff && selected.reserva_activa.estado === 'confirmada' && (
                    <button
                      onClick={() => handleConfirmarReserva(selected.reserva_activa.id)}
                      style={{ width: '100%', padding: '8px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg, var(--green), #3a7a50)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}
                    >
                      <CheckCircle size={13} /> Cliente llegó — Activar
                    </button>
                  )}
                  {isStaff && (
                    <button
                      onClick={() => handleCancelarReserva(selected.reserva_activa.id)}
                      style={{ width: '100%', padding: '7px', borderRadius: 7, border: '1px solid rgba(201,92,92,0.4)', background: 'rgba(201,92,92,0.08)', color: 'var(--danger)', fontSize: 11, cursor: 'pointer' }}
                    >
                      Cancelar reserva
                    </button>
                  )}
                </div>
              )}

              {/* ── ACCIONES ─────────────────────────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                {/* RESERVAR — disponible para todos cuando la mesa está libre */}
                {selected.estado === 'libre' && (
                  <button
                    onClick={() => setShowReserva(true)}
                    style={{ padding: '10px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))', color: '#1a1108', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 3px 12px rgba(224,168,48,0.3)' }}
                  >
                    <Calendar size={14} /> Reservar esta mesa
                  </button>
                )}

                {/* LIBERAR MESA — disponible para TODOS cuando la mesa no está libre */}
                {/* Para clientes: el backend valida que tengan un pedido en esa mesa */}
                {/* Para staff: pueden liberar cualquier mesa */}
                {selected.estado !== 'libre' && (
                  <button
                    onClick={() => handleLiberarMesa(selected)}
                    style={{
                      padding: '10px', borderRadius: 9,
                      border: '1px solid rgba(74,139,92,0.4)',
                      background: 'rgba(74,139,92,0.08)',
                      color: 'var(--green)', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <Unlock size={14} />
                    {isCliente ? 'Ya terminé — Liberar esta mesa' : 'Liberar mesa'}
                  </button>
                )}

                {/* MARCAR OCUPADA — solo staff, cuando está libre */}
                {isStaff && selected.estado === 'libre' && (
                  <button
                    onClick={() => handleSetEstado(selected, 'ocupada')}
                    style={{ padding: '9px', borderRadius: 9, border: '1px solid rgba(201,92,92,0.3)', background: 'rgba(201,92,92,0.07)', color: 'var(--danger)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Lock size={13} /> Marcar ocupada (llegó cliente)
                  </button>
                )}

                {/* Info para cliente en mesa ocupada (sin pedido propio) */}
                {isCliente && selected.estado !== 'libre' && (
                  <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 2 }}>
                    <Info size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Si esta es tu mesa y ya terminaste, usa el botón de arriba para liberarla. Si no es tu mesa, solo puedes reservar mesas libres.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24, opacity: 0.45 }}>
              <MapPin size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                {isCliente
                  ? 'Selecciona una mesa libre para reservarla, o tu mesa actual para liberarla'
                  : 'Selecciona una mesa del mapa para ver sus opciones'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Reserva */}
      {showReserva && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, animation: 'fadeIn 0.25s ease' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: 420, borderRadius: 18, padding: 28, border: '1px solid rgba(224,168,48,0.4)', boxShadow: '0 20px 60px rgba(224,168,48,0.15)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 22, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
                Reservar Mesa {selected.numero}
              </h3>
              <button onClick={() => setShowReserva(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              La mesa quedará reservada. El personal deberá confirmar cuando llegues.
            </p>
            <form onSubmit={handleReserva} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Fecha y hora *</label>
                <input required type="datetime-local" value={reservaForm.fecha_reserva}
                  onChange={e => setReservaForm(f => ({ ...f, fecha_reserva: e.target.value }))}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Notas adicionales</label>
                <textarea value={reservaForm.notas} onChange={e => setReservaForm(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Ej: Ocasión especial, alergias, preferencias..."
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', width: '100%', minHeight: 80, resize: 'none' }}
                />
              </div>
              <button type="submit" disabled={submitting} style={{ padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))', color: '#1a1108', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {submitting ? 'Reservando...' : 'Confirmar reserva'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Mesa (admin) */}
      {showNueva && isAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: 360, borderRadius: 18, padding: 28, border: '1px solid var(--border)', animation: 'slideUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>Nueva Mesa</h3>
              <button onClick={() => setShowNueva(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleNuevaMesa} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Número de mesa *</label>
                <input required type="number" min="1" value={nuevaForm.numero} onChange={e => setNuevaForm(f => ({ ...f, numero: e.target.value }))} placeholder="Ej: 11"
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Capacidad *</label>
                <select value={nuevaForm.capacidad} onChange={e => setNuevaForm(f => ({ ...f, capacidad: e.target.value }))}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', width: '100%' }}
                >
                  {[2, 4, 6, 8].map(n => <option key={n} value={n}>{n} personas</option>)}
                </select>
              </div>
              <button type="submit" disabled={submitting} style={{ padding: '12px', borderRadius: 9, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                {submitting ? 'Creando...' : 'Crear mesa'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes mesaPulse { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.75; } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
