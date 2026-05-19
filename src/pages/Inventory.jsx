// frontend/src/pages/Inventory.jsx
// Fix: imagen habilitada para platillos Y envasados, preview de imagen en edición
import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit, X, Image as ImageIcon } from 'lucide-react';
import api from '../api/axios';

const SEMAFORO_COLORS = {
  rojo:     { bg: '#ffebee', text: '#c62828', label: 'Reposición inmediata' },
  amarillo: { bg: '#fff8e1', text: '#f57f17', label: 'Pronta reposición' },
  verde:    { bg: '#e8f5e9', text: '#2e7d32', label: 'Producto disponible' },
};

export default function Inventory() {
  const user    = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.rol === 'admin';

  const TABS = [
    { id: 'platillos',  label: 'Platillos (Prep.)' },
    ...(isAdmin ? [
      { id: 'envasados',  label: 'Envasados' },
      { id: 'categorias', label: 'Categorías' },
    ] : []),
    { id: 'granel', label: 'A Granel' },
    { id: 'extras', label: 'Extras' },
  ];

  const [activeTab,          setActiveTab]          = useState('granel');
  const [items,              setItems]              = useState([]);
  const [loading,            setLoading]            = useState(false);
  const [newItemName,        setNewItemName]        = useState('');
  const [categorias,         setCategorias]         = useState([]);
  const [extrasDisponibles,  setExtrasDisponibles]  = useState([]);
  const [showModal,          setShowModal]          = useState(null);
  const [editId,             setEditId]             = useState(null);
  const [formData,           setFormData]           = useState({
    nombre: '', precio: '', categoria: '', stock: '',
    descripcion: '', horario: 'todo', extras_ids: [], imagen: null,
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'granel')    endpoint = '/menu/manage/granel/';
      if (activeTab === 'extras')    endpoint = '/menu/manage/extras/';
      if (activeTab === 'categorias') endpoint = '/menu/manage/categorias-admin/';
      if (activeTab === 'envasados') endpoint = '/menu/manage/productos-admin/?tipo=envasado';
      if (activeTab === 'platillos') endpoint = '/menu/manage/productos-admin/?tipo=platillo';

      if (endpoint) {
        const res = await api.get(endpoint);
        setItems(res.data.filter(i =>
          activeTab === 'envasados' ? i.tipo === 'envasado'
          : activeTab === 'platillos' ? i.tipo === 'platillo'
          : true
        ));
      }

      if (activeTab === 'envasados' || activeTab === 'platillos') {
        const catRes = await api.get('/menu/manage/categorias-admin/');
        setCategorias(catRes.data);
      }
      if (activeTab === 'platillos') {
        const extRes = await api.get('/menu/manage/extras/');
        setExtrasDisponibles(extRes.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  // ── CRUD semáforos ─────────────────────────────────────────────────────────
  const handleAddSemaforo = async (type) => {
    if (!newItemName.trim()) return;
    const endpoint = type === 'categorias' ? 'categorias-admin' : type;
    const payload  = type === 'categorias' ? { nombre: newItemName } : { nombre: newItemName, estado: 'verde' };
    try {
      await api.post(`/menu/manage/${endpoint}/`, payload);
      setNewItemName(''); fetchData();
    } catch (e) { alert('Error: ' + JSON.stringify(e.response?.data || e.message)); }
  };

  const updateEstadoSemaforo = async (id, type, nuevoEstado) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, estado: nuevoEstado } : item));
    try {
      await api.patch(`/menu/manage/${type}/${id}/`, { estado: nuevoEstado });
    } catch { fetchData(); alert('Error al actualizar el estado'); }
  };

  const handleDelete = async (id, type) => {
    if (!confirm('¿Eliminar este item?')) return;
    let endpoint = type;
    if (type === 'envasados' || type === 'platillos') endpoint = 'productos-admin';
    if (type === 'categorias') endpoint = 'categorias-admin';
    await api.delete(`/menu/manage/${endpoint}/${id}/`);
    fetchData();
  };

  // ── CRUD productos ─────────────────────────────────────────────────────────
  const updateStock = async (id, currentStock, modifier) => {
    const newStock = Math.max(0, currentStock + modifier);
    await api.patch(`/menu/manage/productos-admin/${id}/`, { stock: newStock });
    fetchData();
  };

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') setFormData(f => ({ ...f, [name]: files[0] }));
    else setFormData(f => ({ ...f, [name]: value }));
  };

  const handleCheckboxExtra = (extraId) => {
    setFormData(prev => ({
      ...prev,
      extras_ids: prev.extras_ids.includes(extraId)
        ? prev.extras_ids.filter(id => id !== extraId)
        : [...prev.extras_ids, extraId],
    }));
  };

  const openEditModal = (item, tipo) => {
    setEditId(item.id);
    setShowModal(tipo);
    setFormData({
      nombre:      item.nombre,
      precio:      item.precio || '',
      categoria:   item.categoria || '',
      stock:       item.stock || '',
      descripcion: item.descripcion || '',
      horario:     item.horario || 'todo',
      extras_ids:  item.extras_asociados ? item.extras_asociados.map(e => e.id) : [],
      imagen:      null,
      // guardamos la URL existente para preview
      imagen_actual: item.imagen || null,
    });
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    const isPlatillo = showModal === 'platillo';
    const data = new FormData();
    data.append('nombre',    formData.nombre);
    data.append('precio',    formData.precio);
    data.append('categoria', formData.categoria);
    data.append('tipo', isPlatillo ? 'platillo' : 'envasado');

    if (isPlatillo) {
      data.append('descripcion', formData.descripcion);
      data.append('horario',     formData.horario);
      formData.extras_ids.forEach(id => data.append('extras_ids', id));
    } else {
      data.append('stock', formData.stock || 0);
    }

    // Imagen para ambos tipos
    if (formData.imagen) data.append('imagen', formData.imagen);

    try {
      if (editId) {
        await api.put(`/menu/manage/productos-admin/${editId}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/menu/manage/productos-admin/', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setShowModal(null); setEditId(null);
      setFormData({ nombre: '', precio: '', categoria: '', stock: '', descripcion: '', horario: 'todo', extras_ids: [], imagen: null, imagen_actual: null });
      fetchData();
    } catch (err) {
      alert('Error al guardar: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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
            fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>

        {/* GRANEL / EXTRAS / CATEGORIAS */}
        {(activeTab === 'granel' || activeTab === 'extras' || activeTab === 'categorias') && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input
                value={newItemName} onChange={e => setNewItemName(e.target.value)}
                placeholder={`Añadir nuevo a ${activeTab}...`}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)' }}
              />
              <button onClick={() => handleAddSemaforo(activeTab)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> Agregar
              </button>
            </div>
            {loading ? <p style={{ color: 'var(--text-muted)' }}>Cargando...</p> : (
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
                                  boxShadow: estadoActual === color ? `0 0 10px ${SEMAFORO_COLORS[color].text}` : 'none',
                                }} title={SEMAFORO_COLORS[color].label} />
                              ))}
                            </div>
                            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 12, background: estadoConfig.bg, color: estadoConfig.text, width: 150, textAlign: 'center' }}>
                              {estadoConfig.label}
                            </span>
                          </>
                        )}
                        <button onClick={() => handleDelete(item.id, activeTab)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ENVASADOS */}
        {activeTab === 'envasados' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ color: 'var(--text-muted)' }}>Control de inventario de bebidas, galletas y productos terminados.</p>
              <button onClick={() => { setEditId(null); setShowModal('envasado'); setFormData({ nombre: '', precio: '', categoria: '', stock: '', descripcion: '', horario: 'todo', extras_ids: [], imagen: null, imagen_actual: null }); }} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <Plus size={16} /> Nuevo Envasado
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {items.map(item => (
                <div key={item.id} style={{ background: 'var(--surface2)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', borderLeft: '4px solid var(--gold)' }}>
                  {/* Imagen si existe */}
                  {item.imagen && (
                    <img src={item.imagen} alt={item.nombre} style={{ width: '100%', height: 90, objectFit: 'cover' }} />
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
                    <div>
                      <p style={{ color: 'var(--text)', fontWeight: 600 }}>{item.nombre}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Bs. {item.precio}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', padding: '6px 10px', borderRadius: 8 }}>
                      <button onClick={() => updateStock(item.id, item.stock, -1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}>-</button>
                      <span style={{ color: 'var(--text)', fontWeight: 700, width: 24, textAlign: 'center' }}>{item.stock}</span>
                      <button onClick={() => updateStock(item.id, item.stock, 1)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 18, cursor: 'pointer' }}>+</button>
                      <button onClick={() => openEditModal(item, 'envasado')} style={{ background: 'none', border: 'none', color: 'var(--accent)', marginLeft: 8, cursor: 'pointer' }}><Edit size={16} /></button>
                      <button onClick={() => handleDelete(item.id, 'envasados')} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLATILLOS */}
        {activeTab === 'platillos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ color: 'var(--text-muted)' }}>Platillos preparados en cocina. Asígnales imagen y extras.</p>
              <button onClick={() => { setEditId(null); setShowModal('platillo'); setFormData({ nombre: '', precio: '', categoria: '', stock: '', descripcion: '', horario: 'todo', extras_ids: [], imagen: null, imagen_actual: null }); }} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <Plus size={16} /> Nuevo Platillo
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
              {items.map(item => (
                <div key={item.id} style={{ background: 'var(--surface2)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  {item.imagen ? (
                    <img src={item.imagen} alt={item.nombre} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: 120, background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon color="var(--text-dim)" />
                    </div>
                  )}
                  <div style={{ padding: 14 }}>
                    <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15 }}>{item.nombre}</p>
                    <p style={{ color: 'var(--gold)', fontWeight: 700, margin: '4px 0 10px' }}>Bs. {item.precio}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEditModal(item, 'platillo')} style={{ flex: 1, padding: '6px', background: 'rgba(92,150,201,0.1)', color: 'var(--accent)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => handleDelete(item.id, 'platillos')} style={{ flex: 1, padding: '6px', background: 'rgba(201,92,92,0.1)', color: 'var(--danger)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Eliminar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR Envasado o Platillo */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: 520, borderRadius: 16, padding: 28, border: '1px solid var(--accent)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 22, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
                {editId ? 'Editar' : 'Crear'} {showModal === 'platillo' ? 'Platillo' : 'Envasado'}
              </h3>
              <button onClick={() => { setShowModal(null); setEditId(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X /></button>
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

              {/* Imagen — disponible para AMBOS tipos */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Imagen del producto
                </label>
                {/* Preview de imagen actual en modo edición */}
                {editId && formData.imagen_actual && !formData.imagen && (
                  <div style={{ marginBottom: 8 }}>
                    <img
                      src={formData.imagen_actual}
                      alt="Imagen actual"
                      style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Imagen actual — sube una nueva para reemplazarla</p>
                  </div>
                )}
                <input
                  type="file" name="imagen"
                  onChange={handleFormChange}
                  accept="image/*"
                  style={{ padding: '8px', color: 'var(--text-muted)', width: '100%' }}
                />
              </div>

              {/* Solo envasados: stock */}
              {showModal === 'envasado' && (
                <input required type="number" name="stock" value={formData.stock} onChange={handleFormChange} placeholder="Stock inicial" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)' }} />
              )}

              {/* Solo platillos: descripción, horario, extras */}
              {showModal === 'platillo' && (
                <>
                  <textarea name="descripcion" value={formData.descripcion} onChange={handleFormChange} placeholder="Descripción del platillo..." style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', minHeight: 80, resize: 'none' }} />
                  <select name="horario" value={formData.horario} onChange={handleFormChange} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)' }}>
                    <option value="todo">Todo el día</option>
                    <option value="desayuno">Solo Desayuno</option>
                    <option value="almuerzo">Solo Almuerzo</option>
                    <option value="cena">Solo Cena</option>
                  </select>
                  <div style={{ marginTop: 4 }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 8 }}>Asociar Extras</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, background: 'var(--surface2)', padding: 12, borderRadius: 8 }}>
                      {extrasDisponibles.map(extra => {
                        const isAgotado = extra.estado === 'rojo';
                        return (
                          <label key={extra.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: isAgotado ? 'var(--danger)' : 'var(--text)', opacity: isAgotado ? 0.5 : 1, cursor: isAgotado ? 'not-allowed' : 'pointer' }}>
                            <input type="checkbox" disabled={isAgotado} checked={formData.extras_ids.includes(extra.id)} onChange={() => handleCheckboxExtra(extra.id)} />
                            {extra.nombre} {isAgotado && '(Agotado)'}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <button type="submit" style={{ padding: '12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, marginTop: 6, cursor: 'pointer' }}>
                {editId ? 'Guardar Cambios' : 'Guardar Producto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
