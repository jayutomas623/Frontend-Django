// Sidebar.jsx — Navegación lateral actualizada
// Cajero ahora tiene acceso al Monitor de Pedidos
// Botón (?) en la parte inferior lanza el tour guiado
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UtensilsCrossed, Banknote, ChefHat, LayoutDashboard,
  LogOut, ChevronLeft, ChevronRight, ClipboardList,
  User, Package, Users, LayoutList, HelpCircle,
} from 'lucide-react';
import api from '../api/axios';

const NAV = {
  cliente: [
    { label: 'Menú',        icon: UtensilsCrossed, path: '/menu'    },
    { label: 'Mis pedidos', icon: ClipboardList,   path: '/monitor' },
  ],
  cajero: [
    { label: 'Panel Caja',  icon: Banknote,        path: '/cashier' },
    { label: 'Monitor',     icon: LayoutList,      path: '/monitor' },
    { label: 'Menú',        icon: UtensilsCrossed, path: '/menu'    },
  ],
  cocina: [
    { label: 'Monitor',     icon: LayoutList,      path: '/monitor' },
    { label: 'Inventario',  icon: Package,         path: '/inventory' },
  ],
  admin: [
    { label: 'Dashboard',   icon: LayoutDashboard, path: '/admin'   },
    { label: 'Monitor',     icon: LayoutList,      path: '/monitor' },
    { label: 'Caja',        icon: Banknote,        path: '/cashier' },
    { label: 'Menú',        icon: UtensilsCrossed, path: '/menu'    },
    { label: 'Inventario',  icon: Package,         path: '/inventory' },
    { label: 'Empleados',   icon: Users,           path: '/employees' },
  ],
};

const ROLE_LABEL = {
  cliente: 'Cliente',
  cajero:  'Cajero',
  cocina:  'Cocina',
  admin:   'Administrador',
};

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

export default function Sidebar() {
  const [collapsed,    setCollapsed]    = useState(false);
  const [helpTooltip,  setHelpTooltip]  = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = JSON.parse(localStorage.getItem('user') || '{}');
  const items     = NAV[user.rol] || NAV.cliente;
  const W         = collapsed ? 64 : 240;

  const handleLogout = async () => {
    try { await api.post('/auth/logout/'); } catch {}
    localStorage.clear();
    navigate('/login');
  };

  const handleStartTour = () => {
    setHelpTooltip(false);
    window.dispatchEvent(new CustomEvent('start-tour'));
  };

  const navBtn = (active) => ({
    width: '100%',
    padding: collapsed ? '10px 0' : '10px 13px',
    borderRadius: 9, border: 'none',
    background: active
      ? 'linear-gradient(135deg, rgba(207,100,48,0.18), rgba(207,100,48,0.08))'
      : 'transparent',
    color: active ? 'var(--accent-light)' : 'var(--text-muted)',
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 14, fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    justifyContent: collapsed ? 'center' : 'flex-start',
    position: 'relative', textAlign: 'left',
    transition: 'background 0.18s, color 0.18s',
    letterSpacing: '0.01em',
  });

  const auxBtn = {
    width: '100%',
    padding: collapsed ? '9px 0' : '9px 13px',
    borderRadius: 9, border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center', gap: 9,
    fontSize: 14, cursor: 'pointer',
    justifyContent: collapsed ? 'center' : 'flex-start',
    transition: 'background 0.18s, color 0.18s',
  };

  return (
    <>
      <aside style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: W,
        background: 'linear-gradient(180deg, #140d08 0%, #0f0905 100%)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.28s cubic-bezier(.4,0,.2,1)',
        zIndex: 200, overflow: 'hidden',
      }}>

        {/* Franja decorativa superior */}
        <div style={{
          height: 3,
          background: 'linear-gradient(90deg, var(--accent), var(--gold), var(--green))',
          flexShrink: 0,
        }} />

        {/* Logo */}
        <div style={{
          height: 60, display: 'flex', alignItems: 'center',
          padding: collapsed ? '0 16px' : '0 18px',
          borderBottom: '1px solid var(--border)',
          gap: 10, flexShrink: 0,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(207,100,48,0.35)',
          }}>
            <UtensilsCrossed size={14} color="#f0e4d2" strokeWidth={2.2} />
          </div>
          {!collapsed && (
            <span style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 22, color: 'var(--text)',
              whiteSpace: 'nowrap', letterSpacing: '0.05em', fontWeight: 600,
            }}>
              Kusillu
            </span>
          )}
        </div>

        {/* User card */}
        <div style={{
          padding: collapsed ? '14px 0' : '13px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: 'rgba(207,100,48,0.04)',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent-glow), rgba(74,139,92,0.1))',
            border: '1.5px solid var(--border-hi)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--accent-light)',
          }}>
            {user.nombre_completo
              ? initials(user.nombre_completo)
              : <User size={14} color="var(--accent-light)" />
            }
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user.nombre_completo || 'Usuario'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 1, letterSpacing: '0.04em' }}>
                {ROLE_LABEL[user.rol] || user.rol}
              </p>
            </div>
          )}
        </div>

        {/* Label sección */}
        {!collapsed && (
          <div style={{
            padding: '14px 18px 6px',
            fontSize: 10, fontWeight: 600,
            color: 'var(--text-dim)', letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>
            Navegación
          </div>
        )}

        {/* Nav items */}
        <nav style={{
          flex: 1, padding: collapsed ? '10px 8px' : '6px 8px',
          display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto',
        }}>
          {items.map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                title={collapsed ? label : undefined}
                style={navBtn(active)}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(207,100,48,0.07)';
                    e.currentTarget.style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                {active && (
                  <span style={{
                    position: 'absolute', left: 0, top: '16%', bottom: '16%',
                    width: 3, borderRadius: 2,
                    background: 'linear-gradient(180deg, var(--accent), var(--gold))',
                  }} />
                )}
                <Icon size={16} strokeWidth={active ? 2.1 : 1.75} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '0 8px' }} />

        {/* Parte inferior */}
        <div style={{ padding: '8px 8px 14px', display: 'flex', flexDirection: 'column', gap: 1 }}>

          {/* Botón de ayuda (?) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={handleStartTour}
              onMouseEnter={() => !collapsed && setHelpTooltip(true)}
              onMouseLeave={() => setHelpTooltip(false)}
              title={collapsed ? 'Guía de inicio' : undefined}
              style={{
                ...auxBtn,
                color: 'var(--accent-light)',
                background: 'rgba(207,100,48,0.06)',
                border: '1px solid rgba(207,100,48,0.15)',
                marginBottom: 2,
              }}
              onMouseEnterCapture={e => {
                e.currentTarget.style.background = 'rgba(207,100,48,0.14)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeaveCapture={e => {
                e.currentTarget.style.background = 'rgba(207,100,48,0.06)';
                e.currentTarget.style.color = 'var(--accent-light)';
              }}
            >
              <HelpCircle size={16} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ fontSize: 13 }}>Guía de inicio</span>}
            </button>

            {/* Tooltip */}
            {helpTooltip && !collapsed && (
              <div style={{
                position: 'absolute', bottom: '110%', left: 0, right: 0,
                background: 'var(--surface)',
                border: '1px solid rgba(207,100,48,0.3)',
                borderRadius: 8, padding: '8px 12px',
                fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                animation: 'fadeUp 0.2s ease',
                zIndex: 300,
              }}>
                Repasa el tutorial interactivo en cualquier momento.
              </div>
            )}
          </div>

          {/* Colapsar */}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expandir' : 'Colapsar'}
            style={auxBtn}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'var(--text)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {collapsed
              ? <ChevronRight size={16} />
              : <><ChevronLeft size={16} /><span>Colapsar</span></>
            }
          </button>

          {/* Salir */}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Salir' : undefined}
            style={auxBtn}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(201,92,92,0.09)';
              e.currentTarget.style.color = 'var(--danger)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Salir</span>}
          </button>
        </div>
      </aside>

      {/* Spacer para que el contenido no quede debajo del sidebar */}
      <div style={{
        width: W, flexShrink: 0,
        transition: 'width 0.28s cubic-bezier(.4,0,.2,1)',
      }} />

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}