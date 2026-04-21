// C:\laragon\www\Proyecto-Django\frontend\src\pages\Inventory.jsx
import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Image as ImageIcon, X } from 'lucide-react';
import api from '../api/axios';

const SEMAFORO_COLORS = {
  rojo: { bg: '#ffebee', text: '#c62828', label: 'Reposición inmediata' },
  amarillo: { bg: '#fff8e1', text: '#f57f17', label: 'Pronta reposición' },
  verde: { bg: '#e8f5e9', text: '#2e7d32', label: 'Producto disponible' }
};

export default function Inventory() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.rol === 'admin';

  const TABS = [
    { id: 'platillos', label: 'Platillos (Prep.)' },
    ...(isAdmin ? [
      { id: 'envasados', label: 'Envasados' },
      { id: 'categorias', label: 'Categorías' }
    ] : []),
    { id: 'granel', label: 'A Granel' },
    { id: 'extras', label: 'Extras' },
  ];

  const [activeTab, setActiveTab] = useState('granel');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  
  // Datos globales para los formularios
  const [categorias, setCategorias] = useState([]);
  const [extrasDisponibles, setExtrasDisponibles] = useState([]);

  // Estados para Modales
  const [showModal, setShowModal] = useState(null); // 'envasado' o 'platillo'
  const [formData, setFormData] = useState({
    nombre: '', precio: '', categoria: '', stock: '', descripcion: '', horario: 'todo', extras_ids: [], imagen: null
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'granel') endpoint = '/menu/manage/granel/';
      if (activeTab === 'extras') endpoint = '/menu/manage/extras/';
      if (activeTab === 'categorias') endpoint = '/menu/manage/categorias-admin/';
      if (activeTab === 'envasados') endpoint = '/menu/manage/productos-admin/?tipo=envasado';
      if (activeTab === 'platillos') endpoint = '/menu/manage/productos-admin/?tipo=platillo';
      
      if (endpoint) {
        const res = await api.get(endpoint);
        setItems(res.data.filter(i => activeTab === 'envasados' ? i.tipo === 'envasado' : activeTab === 'platillos' ? i.tipo === 'platillo' : true));
      }
      
      // Cargar datos extra para formularios
      if (activeTab === 'envasados' || activeTab === 'platillos') {
        const catRes = await api.get('/menu/manage/categorias-admin/');
        setCategorias(catRes.data);
      }
      if (activeTab === 'platillos') {
        const extRes = await api.get('/menu/manage/extras/');
        setExtrasDisponibles(extRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

// --- CRUD GRANEL, EXTRAS Y CATEGORIAS ---
  const handleAddSemaforo = async (type) => {
    if (!newItemName.trim()) return;
    
    // Ajustar el endpoint y el cuerpo según si es categoría o semáforo
    const endpoint = type === 'categorias' ? 'categorias-admin' : type;
    const payload = type === 'categorias' 
      ? { nombre: newItemName } 
      : { nombre: newItemName, estado: 'verde' };

    try {
      await api.post(`/menu/manage/${endpoint}/`, payload);
      setNewItemName('');
      fetchData();
    } catch (e) {
      alert("Error al guardar: " + JSON.stringify(e.response?.data || e.message));
    }
  };

  const updateEstadoSemaforo = async (id, type, nuevoEstado) => {
    await api.patch(`/menu/manage/${type}/${id}/`, { estado: nuevoEstado });
    fetchData();
  };

  const handleDelete = async (id, type) => {
    if(confirm('¿Eliminar este item?')){
      // Ajuste de ruta para todos los tipos especiales
      let endpoint = type;
      if (type === 'envasados' || type === 'platillos') endpoint = 'productos-admin';
      if (type === 'categorias') endpoint = 'categorias-admin';

      await api.delete(`/menu/manage/${endpoint}/${id}/`);
      fetchData();
    }
  };

  // --- CRUD ENVASADOS Y PLATILLOS ---
  const updateStock = async (id, currentStock, modifier) => {
    const newStock = Math.max(0, currentStock + modifier);
    await api.patch(`/menu/manage/productos-admin/${id}/`, { stock: newStock });
    fetchData();
  };

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCheckboxExtra = (extraId) => {
    setFormData(prev => ({
      ...prev,
      extras_ids: prev.extras_ids.includes(extraId)
        ? prev.extras_ids.filter(id => id !== extraId)
        : [...prev.extras_ids, extraId]
    }));
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    const isPlatillo = showModal === 'platillo';
    
    // Usamos FormData porque enviaremos una imagen (archivo)
    const data = new FormData();
    data.append('nombre', formData.nombre);
    data.append('precio', formData.precio);
    data.append('categoria', formData.categoria);
    data.append('tipo', isPlatillo ? 'platillo' : 'envasado');
    
    if (isPlatillo) {
      data.append('descripcion', formData.descripcion);
      data.append('horario', formData.horario);
      formData.extras_ids.forEach(id => data.append('extras_ids', id));
      if (formData.imagen) data.append('imagen', formData.imagen);
    } else {
      data.append('stock', formData.stock || 0);
    }

    try {
      await api.post('/menu/manage/productos-admin/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowModal(null);
      setFormData({ nombre: '', precio: '', categoria: '', stock: '', descripcion: '', horario: 'todo', extras_ids: [], imagen: null });
      fetchData();
    } catch (err) {
      alert('Error al guardar: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '28px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Package size={24} color="var(--accent)" />
        <h2 style={{ fontSize: 26, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
          Almacén e Inventario
        </h2>
      </header>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
            color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
            fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>
        
        {/* VISTA: GRANEL Y EXTRAS Y CATEGORIAS (Listas simples) */}
        {(activeTab === 'granel' || activeTab === 'extras' || activeTab === 'categorias') && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input value={newItemName} onChange={e => setNewItemName(e.target.value)}
                placeholder={`Añadir nuevo a ${activeTab}...`} 
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)' }}
              />
              <button onClick={() => handleAddSemaforo(activeTab)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> Agregar
              </button>
            </div>

            {loading ? <p style={{color:'var(--text-muted)'}}>Cargando...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(item => {
                  const estadoActual = item.estado ? (SEMAFORO_COLORS[item.estado] ? item.estado : 'verde') : null;
                  const estadoConfig = estadoActual ? SEMAFORO_COLORS[estadoActual] : null;

                  return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface2)', padding: '12px 16px', borderRadius: 8 }}>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{item.nombre}</span>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {estadoActual && (
                        <>
                          <div style={{ display: 'flex', gap: 6, background: 'var(--bg)', padding: 6, borderRadius: 20 }}>
                            {['verde', 'amarillo', 'rojo'].map(color => (
                              <button key={color} onClick={() => updateEstadoSemaforo(item.id, activeTab, color)} style={{
                                width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer',
                                background: estadoActual === color ? SEMAFORO_COLORS[color].text : 'var(--surface3)',
                                opacity: estadoActual === color ? 1 : 0.3,
                                boxShadow: estadoActual === color ? `0 0 10px ${SEMAFORO_COLORS[color].text}` : 'none'
                              }} title={SEMAFORO_COLORS[color].label} />
                            ))}
                          </div>
                          <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 12, background: estadoConfig.bg, color: estadoConfig.text, width: 150, textAlign: 'center' }}>
                            {estadoConfig.label}
                          </span>
                        </>
                      )}
                      <button onClick={() => handleDelete(item.id, activeTab)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}

        {/* VISTA: ENVASADOS */}
        {activeTab === 'envasados' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ color: 'var(--text-muted)' }}>Control de inventario de bebidas, galletas y productos terminados.</p>
              <button onClick={() => setShowModal('envasado')} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <Plus size={16} /> Nuevo Envasado
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {items.map(item => (
                <div key={item.id} style={{ background: 'var(--surface2)', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--gold)' }}>
                  <div>
                    <p style={{ color: 'var(--text)', fontWeight: 600 }}>{item.nombre}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Bs. {item.precio}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', padding: '6px 10px', borderRadius: 8 }}>
                    <button onClick={() => updateStock(item.id, item.stock, -1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}>-</button>
                    <span style={{ color: 'var(--text)', fontWeight: 700, width: 24, textAlign: 'center' }}>{item.stock}</span>
                    <button onClick={() => updateStock(item.id, item.stock, 1)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 18, cursor: 'pointer' }}>+</button>
                    <button onClick={() => handleDelete(item.id, 'envasados')} style={{ background: 'none', border: 'none', color: 'var(--danger)', marginLeft: 10, cursor: 'pointer' }}><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA: PLATILLOS */}
        {activeTab === 'platillos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ color: 'var(--text-muted)' }}>Platillos preparados en cocina. Aquí puedes asignarles imagen y extras.</p>
              <button onClick={() => setShowModal('platillo')} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <Plus size={16} /> Nuevo Platillo
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
              {items.map(item => (
                <div key={item.id} style={{ background: 'var(--surface2)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  {item.imagen ? (
                    <img src={item.imagen} alt={item.nombre} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: 120, background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon color="var(--text-dim)"/></div>
                  )}
                  <div style={{ padding: 14 }}>
                    <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15 }}>{item.nombre}</p>
                    <p style={{ color: 'var(--gold)', fontWeight: 700, margin: '4px 0 10px' }}>Bs. {item.precio}</p>
                    <button onClick={() => handleDelete(item.id, 'platillos')} style={{ width: '100%', padding: '6px', background: 'rgba(201,92,92,0.1)', color: 'var(--danger)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* MODAL DE CREACIÓN (Para Envasado o Platillo) */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: 500, borderRadius: 16, padding: 28, border: '1px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 22, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
                Crear {showModal === 'platillo' ? 'Platillo' : 'Envasado'}
              </h3>
              <button onClick={() => setShowModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X /></button>
            </div>

            <form onSubmit={submitProduct} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input required name="nombre" value={formData.nombre} onChange={handleFormChange} placeholder="Nombre del producto" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)' }} />
              
              <div style={{ display: 'flex', gap: 10 }}>
                <input required type="number" step="0.10" name="precio" value={formData.precio} onChange={handleFormChange} placeholder="Precio (Bs)" style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)' }} />
                
                <select required name="categoria" value={formData.categoria} onChange={handleFormChange} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)' }}>
                  <option value="">Seleccionar Categoría</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              {/* Campos específicos de ENVASADO */}
              {showModal === 'envasado' && (
                <input required type="number" name="stock" value={formData.stock} onChange={handleFormChange} placeholder="Stock Inicial" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)' }} />
              )}

              {/* Campos específicos de PLATILLO */}
              {showModal === 'platillo' && (
                <>
                  <textarea name="descripcion" value={formData.descripcion} onChange={handleFormChange} placeholder="Descripción del platillo..." style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', minHeight: 80, resize: 'none' }} />
                  
                  <div style={{ display: 'flex', gap: 10 }}>
                    <select name="horario" value={formData.horario} onChange={handleFormChange} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)' }}>
                      <option value="todo">Todo el día</option>
                      <option value="desayuno">Solo Desayuno</option>
                      <option value="almuerzo">Solo Almuerzo</option>
                      <option value="cena">Solo Cena</option>
                    </select>
                    <input type="file" name="imagen" onChange={handleFormChange} accept="image/*" style={{ flex: 1, padding: '8px', color: 'var(--text-muted)' }} />
                  </div>

                  {/* Selección de EXTRAS */}
                  <div style={{ marginTop: 10 }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 8 }}>Asociar Extras (Los agotados no se pueden seleccionar)</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, background: 'var(--surface2)', padding: 12, borderRadius: 8 }}>
                      {extrasDisponibles.map(extra => {
                        const isAgotado = extra.estado === 'rojo';
                        return (
                          <label key={extra.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: isAgotado ? 'var(--danger)' : 'var(--text)', opacity: isAgotado ? 0.5 : 1, cursor: isAgotado ? 'not-allowed' : 'pointer' }}>
                            <input 
                              type="checkbox" 
                              disabled={isAgotado}
                              checked={formData.extras_ids.includes(extra.id)}
                              onChange={() => handleCheckboxExtra(extra.id)}
                            />
                            {extra.nombre} {isAgotado && '(Agotado)'}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              <button type="submit" style={{ padding: '12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, marginTop: 10, cursor: 'pointer' }}>
                Guardar Producto
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}