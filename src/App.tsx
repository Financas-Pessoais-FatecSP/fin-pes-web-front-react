import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Cadastro from './pages/Cadastro/Cadastro';
import FinanceDashboard from './pages/Dashboard/FinanceDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function RotasPrivadas() {
  const { token } = useAuth();

  return token ? <FinanceDashboard /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="*" element={<Home />} />
        <Route path="/" element={<Home />} />
        <Route path="/dash" element={<RotasPrivadas />} />
        <Route path="/dashboard" element={<RotasPrivadas />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
      </Routes>
    </AuthProvider>
  );
}
