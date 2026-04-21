// C:\laragon\www\Proyecto-Django\frontend\src\pages\PaymentQR.jsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, ArrowLeft, Loader } from 'lucide-react';

// Generador de Sonido de Éxito (Acorde ascendente)
const playSuccessSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // Do
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // Mi
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // Sol
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.8);
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) { console.log('Audio error'); }
};

export default function PaymentQR() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const order     = state?.order;
  
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!order) { navigate('/menu'); return; }

    // Temporizador visual
    const interval = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);

    // Animación de éxito a los 5 segundos
    const timer = setTimeout(() => {
      setPagoExitoso(true);
      playSuccessSound();
      // Redirigir después de mostrar el éxito por 3 segundos
      setTimeout(() => navigate('/menu'), 3000);
    }, 5000);

    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [order, navigate]);

  if (!order) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeUp 0.35s ease' }}>
        
        {!pagoExitoso && (
          <button onClick={() => navigate('/menu')} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 28, padding: 0, border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={15} /> Volver al menú
          </button>
        )}

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.4)', textAlign: 'center', position: 'relative' }}>
          
          {/* VISTA 1: ESPERANDO PAGO (5 segundos) */}
          {!pagoExitoso ? (
            <div style={{ padding: 32, animation: 'fadeIn 0.5s ease' }}>
              <h2 style={{ fontSize: 26, marginBottom: 8, fontFamily: 'Cormorant Garamond, serif', color: 'var(--text)' }}>
                Escanea para pagar
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
                Abre tu aplicación bancaria y escanea el código.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{ background: '#fff', padding: 18, borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.5)', border: '3px solid var(--surface3)' }}>
                  <QRCodeSVG value={`kusillu-payment:${order.codigo}:${order.total}`} size={180} fgColor="#1a1108" bgColor="#ffffff" />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--accent)', fontSize: 14, fontWeight: 500 }}>
                <Loader size={16} style={{ animation: 'spin 2s linear infinite' }} />
                Esperando confirmación... ({countdown}s)
              </div>
            </div>
          ) : (
            
            /* VISTA 2: PAGO EXITOSO (Animación) */
            <div style={{ padding: '60px 32px', animation: 'scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(74,139,92,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 40px rgba(74,139,92,0.4)' }}>
                <CheckCircle size={48} color="var(--green)" />
              </div>
              <h2 style={{ fontSize: 28, color: 'var(--green)', fontFamily: 'Cormorant Garamond, serif', marginBottom: 10 }}>
                ¡Pago Recibido!
              </h2>
              <p style={{ color: 'var(--text)', fontSize: 16, fontWeight: 600 }}>Bs. {order.total}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 10 }}>
                Tu pedido ha sido enviado a cocina.
              </p>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes scaleUp { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}