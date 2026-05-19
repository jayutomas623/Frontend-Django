import { useState, useEffect } from 'react';
import { Users, UserPlus, CheckCircle, AlertCircle, Trash2, Power } from 'lucide-react';
import api from '../api/axios';

export default function Employees() {
  const [form, setForm] = useState({
    nombre_completo: '', email: '', telefono: '', direccion: '', ci: '',
    fecha_nacimiento: '', sexo: '', rol: 'cajero', password: '', password2: ''
  });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });


  const [empleados, setEmpleados] = useState([]);

  const fetchEmpleados = async () => {
    try {
      const res = await api.get('/auth/employees-list/');
      setEmpleados(res.data);
    } catch (error) {
      console.error("Error al cargar empleados", error);
    }
  };

  useEffect(() => { 
    fetchEmpleados(); 
  }, []);

  const toggleEstado = async (id, currentState) => {
    try {
      await api.patch(`/auth/employees/${id}/`, { is_active: !currentState });
      fetchEmpleados();
    } catch (error) {
      alert("Error al cambiar el estado del empleado.");
    }
  };

  const eliminarEmpleado = async (id) => {
    if(confirm("¿Eliminar este empleado definitivamente?")) {
      try {
        await api.delete(`/auth/employees/${id}/`);
        fetchEmpleados();
      } catch (error) {
        alert("Error al eliminar al empleado.");
      }
    }
  };

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
      // Recargar tabla después de crear
      fetchEmpleados();
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

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, maxWidth: 900, animation: 'fadeUp 0.3s ease', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <UserPlus size={20} color="var(--accent-light)" />
          <h3 style={{ color: 'var(--text)', fontSize: 18 }}>Registrar Nuevo Personal</h3>
        </div>

        {statusMsg.text && (
          <div style={{ background: statusMsg.type === 'success' ? '#e8f5e9' : '#ffebee', color: statusMsg.type === 'success' ? '#2e7d32' : '#c62828', padding: '12px', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
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

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, maxWidth: 900, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <Users size={20} color="var(--accent-light)" />
          <h3 style={{ color: 'var(--text)', fontSize: 18 }}>Lista de Personal</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: 12 }}>Nombre</th>
                <th style={{ padding: 12 }}>Rol</th>
                <th style={{ padding: 12 }}>Contacto</th>
                <th style={{ padding: 12 }}>Estado</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                  <td style={{ padding: 12, fontWeight: 500 }}>{emp.nombre_completo}</td>
                  <td style={{ padding: 12, textTransform: 'capitalize' }}>{emp.rol}</td>
                  <td style={{ padding: 12 }}>
                    <div>{emp.email}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.telefono || 'Sin teléfono'}</div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      background: emp.is_active ? '#e8f5e9' : '#ffebee',
                      color: emp.is_active ? '#2e7d32' : '#c62828'
                    }}>
                      {emp.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <button 
                      onClick={() => toggleEstado(emp.id, emp.is_active)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 12, color: emp.is_active ? 'var(--text-muted)' : 'var(--accent)' }} 
                      title={emp.is_active ? "Desactivar / Dar de baja" : "Activar / Reincorporar"}
                    >
                      <Power size={18} />
                    </button>
                    <button 
                      onClick={() => eliminarEmpleado(emp.id)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} 
                      title="Eliminar del sistema"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {empleados.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay empleados registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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