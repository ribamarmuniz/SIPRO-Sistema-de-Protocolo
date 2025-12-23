import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FiX } from 'react-icons/fi';
import api from '../services/api'; // Importando API para recuperação real
import './Login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Estados do Modal de Recuperação
    const [modalRecuperacao, setModalRecuperacao] = useState(false);
    const [recEmail, setRecEmail] = useState('');
    const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (!email || !senha) {
            toast.error('Preencha todos os campos');
            return;
        }

        setLoading(true);

        try {
            await login(email, senha);
            toast.success('Login realizado com sucesso!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    }

    async function handleRecuperarSenha(e) {
        e.preventDefault();
        
        if (!recEmail) {
            toast.warning('Informe seu E-mail');
            return;
        }

        setEnviandoRecuperacao(true);

        try {
            // Chamada real ao backend
            await api.post('/auth/recuperar-senha', { email: recEmail });
            
            toast.success('Uma nova senha temporária foi enviada para seu e-mail!');
            setModalRecuperacao(false);
            setRecEmail('');
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao recuperar senha. Verifique o e-mail.');
        } finally {
            setEnviandoRecuperacao(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-logo">
                    <img src="/logo-uema.png" alt="UEMA" />
                </div>

                <h2>Sistema de Protocolo Geral</h2>
                <p className="login-subtitle">PROG - UEMA</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>

                    <button 
                        type="button" 
                        className="forgot-password-btn" 
                        onClick={() => setModalRecuperacao(true)}
                    >
                        Esqueci minha senha
                    </button>
                </form>

                <div className="login-footer">
                    <p>Universidade Estadual do Maranhão</p>
                </div>
            </div>

            {/* Modal Recuperação de Senha */}
            {modalRecuperacao && (
                <div className="modal-overlay">
                    <div className="modal modal-sm">
                        <div className="modal-header">
                            <h3>Recuperar Senha</h3>
                            <button className="btn-close" onClick={() => setModalRecuperacao(false)}>
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={handleRecuperarSenha}>
                            <div className="modal-body">
                                <p className="modal-text">
                                    Informe seu e-mail cadastrado. Enviaremos uma nova senha provisória para ele.
                                </p>
                                <div className="form-group">
                                    <label>E-mail</label>
                                    <input
                                        type="email"
                                        value={recEmail}
                                        onChange={(e) => setRecEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => setModalRecuperacao(false)}
                                    disabled={enviandoRecuperacao}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={enviandoRecuperacao}
                                >
                                    {enviandoRecuperacao ? 'Enviando...' : 'Recuperar Senha'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Login;