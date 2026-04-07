import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, Calendar, UserPlus } from 'lucide-react';
import api from '../api/axios';

export default function Register() {
  const [form, setForm] = useState({
    email: '', nombre_completo: '', telefono: '',
    fecha_nacimiento: '', sexo: '', password: '', password2: ''
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.password2) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/register/', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/menu');
    } catch (err) {
      const data = err.response?.data;
      const msg  = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Error al registrarse.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = 'text', placeholder, Icon }) => (
    <div style={{ marginBottom: 15 }}>
      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />}
        <input
          name={name} type={type} value={form[name]}
          onChange={handleChange} placeholder={placeholder}
          style={Icon ? { paddingLeft: 40 } : {}} required
        />
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '32px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 460, animation: 'fadeUp 0.4s ease' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(207,100,48,0.35)',
            fontSize: 26,
          }}>
            
          </div>
          <h1 style={{ fontSize: 32, color: 'var(--text)', marginBottom: 6 }}>Crear cuenta</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Únete a Kusillu</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16, padding: 32,
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}>
          {error && (
            <div style={{
              background: 'var(--danger-bg)', border: '1px solid rgba(201,92,92,0.3)',
              color: 'var(--danger)', borderRadius: 8,
              padding: '10px 14px', marginBottom: 20, fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Nombre completo" name="nombre_completo" placeholder="Tu nombre" Icon={User} />
              </div>
              <Field label="Correo electrónico" name="email" type="email" placeholder="tu@correo.com" Icon={Mail} />
              <Field label="Teléfono" name="telefono" placeholder="+591 7xxxxxxx" Icon={Phone} />
              <Field label="Fecha de nacimiento" name="fecha_nacimiento" type="date" Icon={Calendar} />

              {/* Sexo */}
              <div style={{ marginBottom: 15 }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Sexo
                </label>
                <select name="sexo" value={form.sexo} onChange={handleChange}>
                  <option value="">Seleccionar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
              <Field label="Contraseña" name="password" type="password" placeholder="••••••••" Icon={Lock} />
              <Field label="Repetir contraseña" name="password2" type="password" placeholder="••••••••" Icon={Lock} />
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px 0', marginTop: 8,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
              color: '#f0e4d2', fontWeight: 600, borderRadius: 9, fontSize: 15,
              border: 'none', letterSpacing: '0.02em',
              boxShadow: '0 4px 18px rgba(207,100,48,0.3)',
            }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: 'var(--accent-light)', fontWeight: 500 }}>
              Inicia sesión
            </Link>
          </p>
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