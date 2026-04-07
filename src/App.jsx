import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Menu        from './pages/Menu';
import Checkout    from './pages/Checkout';
import PaymentQR   from './pages/PaymentQR';
import PaymentCash from './pages/PaymentCash';
import Kitchen     from './pages/Kitchen';
import Cashier     from './pages/Cashier';
import Layout      from './components/Layout';

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
        {/* Rutas públicas — sin sidebar */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas privadas — con sidebar */}
        <Route path="/menu" element={
          <PrivateRoute><Menu /></PrivateRoute>
        }/>
        <Route path="/checkout" element={
          <PrivateRoute><Checkout /></PrivateRoute>
        }/>
        <Route path="/payment/qr" element={
          <PrivateRoute><PaymentQR /></PrivateRoute>
        }/>
        <Route path="/payment/cash" element={
          <PrivateRoute><PaymentCash /></PrivateRoute>
        }/>
        <Route path="/kitchen" element={
          <PrivateRoute roles={['cocina', 'admin']}><Kitchen /></PrivateRoute>
        }/>
        <Route path="/cashier" element={
          <PrivateRoute roles={['cajero', 'admin']}><Cashier /></PrivateRoute>
        }/>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
