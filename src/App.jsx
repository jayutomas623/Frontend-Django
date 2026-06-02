// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login          from './pages/Login';
import Register       from './pages/Register';
import Menu           from './pages/Menu';
import Checkout       from './pages/Checkout';
import PaymentQR      from './pages/PaymentQR';
import PaymentCash    from './pages/PaymentCash';
import Kitchen        from './pages/Kitchen';
import Cashier        from './pages/Cashier';
import AdminDashboard from './pages/AdminDashboard';
import Layout         from './components/Layout';
import Inventory      from './pages/Inventory';
import Employees      from './pages/Employees';
import TableMap       from './pages/TableMap';
import Promotions from './pages/Promotions';

function PrivateRoute({ children, roles }) {
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/menu" />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Cliente + todos */}
        <Route path="/menu"         element={<PrivateRoute><Menu /></PrivateRoute>} />
        <Route path="/checkout"     element={<PrivateRoute><Checkout /></PrivateRoute>} />
        <Route path="/payment/qr"   element={<PrivateRoute><PaymentQR /></PrivateRoute>} />
        <Route path="/payment/cash" element={<PrivateRoute><PaymentCash /></PrivateRoute>} />

        {/* Mapa de mesas */}
        <Route path="/mesas" element={<PrivateRoute><TableMap /></PrivateRoute>} />

        {/* Monitor de pedidos */}
        <Route path="/monitor" element={<PrivateRoute><Kitchen /></PrivateRoute>} />
        <Route path="/kitchen" element={<Navigate to="/monitor" replace />} />

        {/* Personal */}
        <Route path="/cashier"   element={<PrivateRoute roles={['cajero', 'admin']}><Cashier /></PrivateRoute>} />
        <Route path="/inventory" element={<PrivateRoute roles={['admin', 'cocina']}><Inventory /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin"     element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/employees" element={<PrivateRoute roles={['admin']}><Employees /></PrivateRoute>} />
        <Route path="/promotions" element={<PrivateRoute roles={['admin']}><Promotions /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
