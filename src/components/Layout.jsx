// C:\laragon\www\Proyecto-Django\frontend\src\components\Layout.jsx
import Sidebar from './Sidebar';
import GuidedTour from './GuidedTour';
import Chatbot from './Chatbot';

export default function Layout({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // El chatbot sólo aparece para roles operacionales (no para clientes)
  const showChatbot = ['admin', 'cajero', 'cocina'].includes(user.rol);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg)',
    }}>
      <Sidebar />
      <GuidedTour />
      <main style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>
      {showChatbot && <Chatbot />}
    </div>
  );
}