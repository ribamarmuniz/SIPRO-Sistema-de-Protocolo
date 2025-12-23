import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Setores from './pages/Setores';
import Protocolos from './pages/Protocolos';
import ProtocoloDetalhes from './pages/ProtocoloDetalhes';
import BuscaIA from './pages/BuscaIA';
import Relatorios from './pages/Relatorios';
import Layout from './components/Layout';

import './styles/global.css';

// Rota protegida
function PrivateRoute({ children }) {
    const { signed, loading } = useAuth();

    if (loading) {
        return <div className="loading">Carregando...</div>;
    }

    if (!signed) {
        return <Navigate to="/login" />;
    }

    return <Layout>{children}</Layout>;
}

// Rota apenas para admin
function AdminRoute({ children }) {
    const { signed, loading, usuario } = useAuth();

    if (loading) {
        return <div className="loading">Carregando...</div>;
    }

    if (!signed) {
        return <Navigate to="/login" />;
    }

    if (usuario?.perfil !== 'admin') {
        return <Navigate to="/" />;
    }

    return <Layout>{children}</Layout>;
}

function AppRoutes() {
    const { signed } = useAuth();

    return (
        <Routes>
            <Route 
                path="/login" 
                element={signed ? <Navigate to="/" /> : <Login />} 
            />
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                }
            />
            <Route
                path="/protocolos"
                element={
                    <PrivateRoute>
                        <Protocolos />
                    </PrivateRoute>
                }
            />
            <Route
                path="/protocolos/:id"
                element={
                    <PrivateRoute>
                        <ProtocoloDetalhes />
                    </PrivateRoute>
                }
            />
            <Route
                path="/busca-ia"
                element={
                    <PrivateRoute>
                        <BuscaIA />
                    </PrivateRoute>
                }
            />
            <Route
                path="/relatorios"
                element={
                    <PrivateRoute>
                        <Relatorios />
                    </PrivateRoute>
                }
            />
            <Route
                path="/setores"
                element={
                    <PrivateRoute>
                        <Setores />
                    </PrivateRoute>
                }
            />
            <Route
                path="/usuarios"
                element={
                    <AdminRoute>
                        <Usuarios />
                    </AdminRoute>
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    closeOnClick
                    pauseOnHover
                />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;