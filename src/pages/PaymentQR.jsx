import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export default function PaymentQR() {
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
            background: 'rgba(74,139,92,0.1)', borderBottom: '1px solid rgba(74,139,92,0.22)',
            padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <CheckCircle size={18} color="var(--green)" />
            <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 14 }}>
              Pedido confirmado
            </span>
          </div>

          <div style={{ padding: 28 }}>
            <h2 style={{
              fontSize: 28, marginBottom: 6, textAlign: 'center',
              fontFamily: 'Cormorant Garamond, serif',
            }}>
              Escanea para pagar
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
              Muestra este código en caja o escanéalo con tu app de pagos
            </p>

            {/* QR */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
              <div style={{
                background: '#fff', padding: 18, borderRadius: 14,
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                border: '3px solid var(--surface3)',
              }}>
                <QRCodeSVG
                  value={`kusillu-payment:${order.codigo}:${order.total}`}
                  size={196}
                  fgColor="#1a1108"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            {/* Monto destacado */}
            <div style={{
              textAlign: 'center', marginBottom: 18,
              padding: '12px 0', borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: 2, textTransform: 'uppercase' }}>
                Total a pagar
              </p>
              <p style={{
                fontSize: 32, fontWeight: 700, color: 'var(--gold)',
                fontFamily: 'Cormorant Garamond, serif',
              }}>
                Bs. {order.total}
              </p>
            </div>

            {/* Info */}
            <div style={{
              background: 'var(--surface2)', borderRadius: 10, padding: 14,
              display: 'flex', flexDirection: 'column', gap: 10,
              border: '1px solid var(--border)',
            }}>
              {[
                { label: 'Código de pedido', value: order.codigo?.slice(0, 8).toUpperCase() },
                { label: 'Método',           value: 'Pago QR' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{value}</span>
                </div>
              ))}
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