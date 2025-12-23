import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaFacebookF, FaYoutube, FaInstagram, FaTwitter, FaUser, FaKey } from 'react-icons/fa';
import { FiLogOut, FiBell, FiCheck, FiTrash2, FiUser, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import './Header.css';

function Header() {
    const { usuario, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Notificações e Menu Usuário
    const [notificacoes, setNotificacoes] = useState([]);
    const [naoLidas, setNaoLidas] = useState(0);
    const [dropdownNotifAberto, setDropdownNotifAberto] = useState(false);
    const [dropdownUserAberto, setDropdownUserAberto] = useState(false);
    
    // Modais
    const [modalMeusDados, setModalMeusDados] = useState(false);
    const [modalSenha, setModalSenha] = useState(false);

    // Estados para alteração de senha
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [salvandoSenha, setSalvandoSenha] = useState(false);
    
    const dropdownNotifRef = useRef(null);
    const dropdownUserRef = useRef(null);

    const menuItems = [
        { path: '/', label: 'Home' },
        { path: '/protocolos', label: 'Protocolos' },
        { path: '/busca-ia', label: 'Busca por IA' },
        { path: '/relatorios', label: 'Relatórios' },
        { path: '/setores', label: 'Setores' },
    ];

    if (usuario?.perfil === 'admin') {
        menuItems.push({ path: '/usuarios', label: 'Usuários' });
    }

    useEffect(() => {
        carregarNotificacoes();
        const interval = setInterval(carregarContadorNotificacoes, 30000);
        return () => clearInterval(interval);
    }, []);

    // Fechar dropdowns ao clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownNotifRef.current && !dropdownNotifRef.current.contains(event.target)) {
                setDropdownNotifAberto(false);
            }
            if (dropdownUserRef.current && !dropdownUserRef.current.contains(event.target)) {
                setDropdownUserAberto(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function carregarNotificacoes() {
        try {
            const [notifRes, countRes] = await Promise.all([
                api.get('/notificacoes'),
                api.get('/notificacoes/nao-lidas/count')
            ]);
            setNotificacoes(notifRes.data);
            setNaoLidas(countRes.data.total);
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    }

    async function carregarContadorNotificacoes() {
        try {
            const response = await api.get('/notificacoes/nao-lidas/count');
            setNaoLidas(response.data.total);
        } catch (error) {
            console.error('Erro ao carregar contador:', error);
        }
    }

    async function marcarComoLida(id) {
        try {
            await api.put(`/notificacoes/${id}/lida`);
            setNotificacoes(notificacoes.map(n => 
                n.id === id ? { ...n, lida: 1 } : n
            ));
            setNaoLidas(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Erro ao marcar notificação:', error);
        }
    }

    async function marcarTodasComoLidas() {
        try {
            await api.put('/notificacoes/marcar-todas-lidas');
            setNotificacoes(notificacoes.map(n => ({ ...n, lida: 1 })));
            setNaoLidas(0);
        } catch (error) {
            console.error('Erro ao marcar todas:', error);
        }
    }

    async function excluirNotificacao(id, e) {
        e.stopPropagation();
        try {
            await api.delete(`/notificacoes/${id}`);
            const notif = notificacoes.find(n => n.id === id);
            setNotificacoes(notificacoes.filter(n => n.id !== id));
            if (notif && !notif.lida) {
                setNaoLidas(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
        }
    }

    function formatarTempo(data) {
        const agora = new Date();
        const dataNotif = new Date(data);
        const diffMs = agora - dataNotif;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHoras = Math.floor(diffMs / 3600000);
        const diffDias = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'Agora';
        if (diffMin < 60) return `${diffMin}min atrás`;
        if (diffHoras < 24) return `${diffHoras}h atrás`;
        if (diffDias < 7) return `${diffDias}d atrás`;
        return dataNotif.toLocaleDateString('pt-BR');
    }

    function getIconeNotificacao(tipo) {
        switch (tipo) {
            case 'novo_protocolo': return '';
            case 'tramitacao': return '';
            case 'recebido': return '';
            case 'arquivado': return '';
            default: return '';
        }
    }

    function handleNotificacaoClick(notif) {
        if (!notif.lida) {
            marcarComoLida(notif.id);
        }
        if (notif.protocolo_id) {
            navigate(`/protocolos/${notif.protocolo_id}`);
            setDropdownNotifAberto(false);
        }
    }

    function handleLogout() {
        logout();
        navigate('/login');
    }

    async function handleAlterarSenha(e) {
        e.preventDefault();
        
        if (novaSenha !== confirmarSenha) {
            toast.error('As senhas não conferem');
            return;
        }

        if (novaSenha.length < 6) {
            toast.error('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        setSalvandoSenha(true);
        try {
            await api.put('/auth/alterar-senha', {
                senhaAtual,
                novaSenha
            });
            toast.success('Senha alterada com sucesso!');
            setModalSenha(false);
            setSenhaAtual('');
            setNovaSenha('');
            setConfirmarSenha('');
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao alterar senha');
        } finally {
            setSalvandoSenha(false);
        }
    }

    // Helper para pegar inicial
    const userInicial = usuario?.nome ? usuario.nome.charAt(0).toUpperCase() : 'U';
    // Helper para pegar o setor corretamente
    const userSetor = usuario?.setor?.sigla || usuario?.setor_sigla || 'Sem setor';

    return (
        <>
            <header className="site-header">
                {/* Barra Superior */}
                <div className="header-top">
                    <div className="container">
                        <div className="header-social">
                            <a href="https://www.facebook.com/uemaoficial" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
                            <a href="https://www.youtube.com/@uemaoficial" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
                            <a href="https://www.instagram.com/uemaoficial" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
                            <a href="https://x.com/uemaoficial" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
                        </div>

                        <div className="header-top-center">
                            <a href="https://www.uema.br" target="_blank" rel="noopener noreferrer" className="header-btn-blue">Site da UEMA</a>
                            <a href="https://sis.sig.uema.br/sigaa" target="_blank" rel="noopener noreferrer" className="header-btn-blue">SigUema Acadêmico</a>
                            <a href="https://sis.sig.uema.br/sipac" target="_blank" rel="noopener noreferrer" className="header-btn-blue">SigUema Administrativo</a>
                            <a href="https://sis.sig.uema.br/sigrh" target="_blank" rel="noopener noreferrer" className="header-btn-blue">Recursos Humanos</a>
                        </div>

                        <div className="header-top-right">
                            <a href="https://www.uema.br/ouvidoria/" target="_blank" rel="noopener noreferrer" className="header-link-gray">Ouvidoria</a>
                            <a href="https://www.uema.br/guia-telefonico/" target="_blank" rel="noopener noreferrer" className="header-link-gray">Guia Telefônico</a>
                        </div>
                    </div>
                </div>

                {/* Barra Principal */}
                <div className="header-main">
                    <div className="container">
                        <div className="header-logo">
                            <img src="/logo-uema.png" alt="UEMA" />
                        </div>

                        <div className="header-user">
                            {/* Notificações */}
                            <div className="notificacoes-wrapper" ref={dropdownNotifRef}>
                                <button 
                                    className="btn-notificacoes"
                                    onClick={() => setDropdownNotifAberto(!dropdownNotifAberto)}
                                >
                                    <FiBell />
                                    {naoLidas > 0 && (
                                        <span className="notificacoes-badge">
                                            {naoLidas > 99 ? '99+' : naoLidas}
                                        </span>
                                    )}
                                </button>

                                {dropdownNotifAberto && (
                                    <div className="notificacoes-dropdown">
                                        <div className="notificacoes-header">
                                            <h4>Notificações</h4>
                                            {naoLidas > 0 && (
                                                <button className="btn-marcar-todas" onClick={marcarTodasComoLidas}>
                                                    <FiCheck /> Marcar todas como lidas
                                                </button>
                                            )}
                                        </div>
                                        <div className="notificacoes-lista">
                                            {notificacoes.length === 0 ? (
                                                <div className="notificacoes-vazio">
                                                    <FiBell />
                                                    <p>Nenhuma notificação</p>
                                                </div>
                                            ) : (
                                                notificacoes.slice(0, 10).map(notif => (
                                                    <div 
                                                        key={notif.id}
                                                        className={`notificacao-item ${!notif.lida ? 'nao-lida' : ''}`}
                                                        onClick={() => handleNotificacaoClick(notif)}
                                                    >
                                                        <span className="notificacao-icone">{getIconeNotificacao(notif.tipo)}</span>
                                                        <div className="notificacao-conteudo">
                                                            <p className="notificacao-titulo">{notif.titulo}</p>
                                                            <p className="notificacao-mensagem">{notif.mensagem}</p>
                                                            <span className="notificacao-tempo">{formatarTempo(notif.criado_em)}</span>
                                                        </div>
                                                        <button className="btn-excluir-notif" onClick={(e) => excluirNotificacao(notif.id, e)}>
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="user-info">
                                <span className="user-name">{usuario?.nome}</span>
                                <span className="user-setor">{userSetor}</span>
                            </div>

                            {/* Menu Usuário */}
                            <div className="user-menu-wrapper" ref={dropdownUserRef}>
                                <button 
                                    className="btn-user-avatar"
                                    onClick={() => setDropdownUserAberto(!dropdownUserAberto)}
                                >
                                    {userInicial}
                                </button>

                                {dropdownUserAberto && (
                                    <div className="user-dropdown">
                                        <div className="user-dropdown-header">
                                            <strong>{usuario?.nome}</strong>
                                            <span>{usuario?.email}</span>
                                        </div>
                                        <ul className="user-dropdown-menu">
                                            <li>
                                                <button onClick={() => { setModalMeusDados(true); setDropdownUserAberto(false); }}>
                                                    <FiUser /> Meus Dados
                                                </button>
                                            </li>
                                            <li>
                                                <button onClick={() => { setModalSenha(true); setDropdownUserAberto(false); }}>
                                                    <FaKey /> Alterar Senha
                                                </button>
                                            </li>
                                            <li className="divider"></li>
                                            <li>
                                                <button className="text-danger" onClick={handleLogout}>
                                                    <FiLogOut /> Sair do Sistema
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navegação */}
                <nav className="header-nav">
                    <div className="container">
                        <ul className="nav-menu">
                            {menuItems.map((item) => (
                                <li key={item.path}>
                                    <Link to={item.path} className={location.pathname === item.path ? 'active' : ''}>
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <div className="nav-sistema">
                            <span>Sistema de Protocolo Geral - UEMA</span>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Modal Meus Dados */}
            {modalMeusDados && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Meus Dados</h3>
                            <button className="btn-close" onClick={() => setModalMeusDados(false)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Nome</label>
                                <input type="text" value={usuario?.nome} disabled className="input-disabled" />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="text" value={usuario?.email} disabled className="input-disabled" />
                            </div>
                            <div className="form-group">
                                <label>Setor</label>
                                <input type="text" value={userSetor} disabled className="input-disabled" />
                            </div>
                            <div className="form-group">
                                <label>Perfil</label>
                                <input type="text" value={usuario?.perfil} disabled className="input-disabled" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setModalMeusDados(false)}>
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Alterar Senha */}
            {modalSenha && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Alterar Senha</h3>
                            <button className="btn-close" onClick={() => setModalSenha(false)}>
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={handleAlterarSenha}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Senha Atual</label>
                                    <input 
                                        type="password" 
                                        value={senhaAtual}
                                        onChange={e => setSenhaAtual(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nova Senha</label>
                                    <input 
                                        type="password" 
                                        value={novaSenha}
                                        onChange={e => setNovaSenha(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Confirmar Nova Senha</label>
                                    <input 
                                        type="password" 
                                        value={confirmarSenha}
                                        onChange={e => setConfirmarSenha(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalSenha(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={salvandoSenha}>
                                    {salvandoSenha ? 'Salvando...' : 'Salvar Senha'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default Header;