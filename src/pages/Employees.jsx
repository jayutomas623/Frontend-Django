// C:\laragon\www\Proyecto-Django\frontend\src\pages\Employees.jsx
import { useState } from 'react';
import { Users, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';

export default function Employees() {
  const [form, setForm] = useState({
    nombre_completo: '', email: '', telefono: '', direccion: '', ci: '',
    fecha_nacimiento: '', sexo: '', rol: 'cajero', password: '', password2: ''
  });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.password2) {
      setStatusMsg({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }
    
    setLoading(true); setStatusMsg({ type: '', text: '' });
    try {
      await api.post('/auth/employee/', form);
      setStatusMsg({ type: 'success', text: 'Empleado registrado exitosamente.' });
      setForm({ nombre_completo: '', email: '', telefono: '', direccion: '', ci: '', fecha_nacimiento: '', sexo: '', rol: 'cajero', password: '', password2: '' });
    } catch (err) {
      const data = err.response?.data;
      const errorText = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Error al registrar.';
      setStatusMsg({ type: 'error', text: errorText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '28px' }}>
      <header style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Users size={28} color="var(--accent)" />
        <h2 style={{ fontSize: 26, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
          Gestión de Empleados
        </h2>
      </header>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, maxWidth: 800, animation: 'fadeUp 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <UserPlus size={20} color="var(--accent-light)" />
          <h3 style={{ color: 'var(--text)', fontSize: 18 }}>Registrar Nuevo Personal</h3>
        </div>

        {statusMsg.text && (
          <div style={{ background: statusMsg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)', color: statusMsg.type === 'success' ? 'var(--success)' : 'var(--danger)', padding: '12px', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Nombre Completo *" name="nombre_completo" value={form.nombre_completo} onChange={handleChange} required />
            <Field label="Correo Electrónico *" name="email" type="email" value={form.email} onChange={handleChange} required />
            <Field label="Carnet de Identidad (CI) *" name="ci" value={form.ci} onChange={handleChange} required />
            <Field label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />
          </div>
          
          <Field label="Dirección Completa" name="direccion" value={form.direccion} onChange={handleChange} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Field label="Fecha Nacimiento" name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} />
            <div>
              <label style={labelStyle}>Sexo</label>
              <select name="sexo" value={form.sexo} onChange={handleChange} style={inputStyle}>
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Rol *</label>
              <select required name="rol" value={form.rol} onChange={handleChange} style={{...inputStyle, border: '1px solid var(--accent)', color: 'var(--accent-light)'}}>
                <option value="cajero">Cajero</option>
                <option value="cocina">Cocina</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 10 }}>
            <Field label="Contraseña *" name="password" type="password" value={form.password} onChange={handleChange} required />
            <Field label="Repetir Contraseña *" name="password2" type="password" value={form.password2} onChange={handleChange} required />
          </div>

          <button type="submit" disabled={loading} style={{ padding: '14px', background: 'var(--accent)', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, marginTop: 10, cursor: 'pointer' }}>
            {loading ? 'Registrando...' : 'Guardar Empleado'}
          </button>
        </form>
      </div>

      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

const labelStyle = { fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)' };

function Field({ label, ...props }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input style={inputStyle} {...props} />
    </div>
  );
}