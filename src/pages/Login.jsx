import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import api from '../api/axios';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login/', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      const rol = res.data.user.rol;
      if (rol === 'cocina')      navigate('/kitchen');
      else if (rol === 'cajero') navigate('/cashier');
      else                       navigate('/menu');
    } catch {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* Left panel — decorative */}
      <div style={{
        flex: '0 0 42%',
        background: 'linear-gradient(160deg, #2a1208 0%, #0c0806 60%, #0e1208 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 48, position: 'relative', overflow: 'hidden',
      }}
        className="login-panel"
      >
        {/* Big decorative circle */}
        <div style={{
          position: 'absolute', top: -100, left: -100,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(207,100,48,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, right: -80,
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74,139,92,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Decorative lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            rgba(207,100,48,0.025) 40px,
            rgba(207,100,48,0.025) 41px
          )`,
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Logo mark */}
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 28px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(207,100,48,0.4)',
          }}>
            <span style={{ fontSize: 32 }}></span>
          </div>

          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 52, color: 'var(--text)', marginBottom: 12,
            fontWeight: 600, letterSpacing: '0.04em',
            lineHeight: 1,
          }}>
            Kusillu
          </h1>
          <p style={{
            color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7,
            maxWidth: 240, margin: '0 auto',
          }}>
            Sabores que evocan la tierra y la calidez de nuestra cultura
          </p>

          {/* Decorative dots */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 36 }}>
            {['var(--accent)', 'var(--gold)', 'var(--green)'].map((c, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.7,
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '48px 32px',
      }}>
        <div style={{ width: '100%', maxWidth: 380, animation: 'fadeUp 0.4s ease' }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 34, marginBottom: 8, color: 'var(--text)' }}>
              Bienvenido
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              border: '1px solid rgba(201,92,92,0.3)',
              color: 'var(--danger)', borderRadius: 8,
              padding: '11px 15px', marginBottom: 22, fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 7, fontWeight: 500 }}>
                Correo electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{
                  position: 'absolute', left: 13, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-dim)',
                }} />
                <input
                  name="email" type="email" value={form.email}
                  onChange={handleChange} placeholder="tu@correo.com"
                  style={{ paddingLeft: 40 }} required
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 7, fontWeight: 500 }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{
                  position: 'absolute', left: 13, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-dim)',
                }} />
                <input
                  name="password" type="password" value={form.password}
                  onChange={handleChange} placeholder="••••••••"
                  style={{ paddingLeft: 40 }} required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px 0',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
              color: '#f0e4d2', fontWeight: 600, borderRadius: 9, fontSize: 15,
              border: 'none', letterSpacing: '0.02em',
              boxShadow: '0 4px 18px rgba(207,100,48,0.3)',
              transition: 'box-shadow 0.2s, transform 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(207,100,48,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 18px rgba(207,100,48,0.3)'; }}
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: 'var(--accent-light)', fontWeight: 500 }}>
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .login-panel { display: none; }
        }
      `}</style>
    </div>
  );
}