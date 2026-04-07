import Sidebar from './Sidebar';

/**
 * Layout — envuelve todas las páginas autenticadas.
 * Agrega el Sidebar a la izquierda y el contenido a la derecha.
 *
 * Uso:
 *   <Layout>
 *     <TuPagina />
 *   </Layout>
 */
export default function Layout({ children }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg)',
    }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
