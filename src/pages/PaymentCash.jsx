import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Banknote } from 'lucide-react';

export default function PaymentCash() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const order     = state?.order;

  if (!order) { navigate('/menu'); return null; }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeUp 0.35s ease' }}>

        <button onClick={() => navigate('/menu')} style={{
          background: 'none', color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, marginBottom: 28, padding: 0, border: 'none',
        }}>
          <ArrowLeft size={15} /> Volver al menú
        </button>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}>
          {/* Status banner */}
          <div style={{
            background: 'rgba(224,168,48,0.1)', borderBottom: '1px solid rgba(224,168,48,0.2)',
            padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Clock size={18} color="var(--gold)" />
            <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14 }}>
              Esperando pago en caja
            </span>
          </div>

          <div style={{ padding: 28 }}>
            <h2 style={{
              fontSize: 28, marginBottom: 6, textAlign: 'center',
              fontFamily: 'Cormorant Garamond, serif',
            }}>
              Pago en caja
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
              Acércate a caja y muestra tu código de pedido
            </p>

            {/* Código grande */}
            <div style={{
              background: 'linear-gradient(135deg, var(--surface2), var(--surface3))',
              borderRadius: 14, padding: '28px 20px', textAlign: 'center', marginBottom: 20,
              border: '1px solid var(--border-hi)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Decorative */}
              <div style={{
                position: 'absolute', top: -30, right: -30,
                width: 120, height: 120, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(224,168,48,0.1) 0%, transparent 70%)',
              }} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
                Código de pedido
              </p>
              <p style={{
                fontSize: 40, fontWeight: 700, letterSpacing: 7,
                color: 'var(--gold)',
                fontFamily: 'Jost, monospace',
              }}>
                {order.codigo?.slice(0, 8).toUpperCase()}
              </p>
            </div>

            {/* Info */}
            <div style={{
              background: 'var(--surface2)', borderRadius: 10, padding: 16,
              display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 18,
              border: '1px solid var(--border)',
            }}>
              {[
                { label: 'Total a pagar', value: `Bs. ${order.total}`, highlight: true },
                { label: 'Método',        value: 'Efectivo en caja' },
                { label: 'Estado',        value: 'En espera de pago' },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{
                    fontSize: highlight ? 18 : 14,
                    fontWeight: 600,
                    color: highlight ? 'var(--gold)' : 'var(--text)',
                    fontFamily: highlight ? 'Cormorant Garamond, serif' : 'inherit',
                  }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 11,
              background: 'rgba(224,168,48,0.07)', borderRadius: 10, padding: 14,
              border: '1px solid rgba(224,168,48,0.18)',
            }}>
              <Banknote size={17} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                El cajero confirmará tu pago y tu pedido pasará automáticamente a cocina.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}