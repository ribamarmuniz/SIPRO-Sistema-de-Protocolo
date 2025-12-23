import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import './Usuarios.css';

function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [setores, setSetores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [editando, setEditando] = useState(null);
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        perfil: 'usuario',
        setor_id: ''
    });

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        try {
            const [usuariosRes, setoresRes] = await Promise.all([
                api.get('/usuarios'),
                api.get('/setores')
            ]);
            setUsuarios(usuariosRes.data);
            setSetores(setoresRes.data);
        } catch (error) {
            toast.error('Erro ao carregar dados');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function abrirModal(usuario = null) {
        if (usuario) {
            setEditando(usuario);
            setFormData({
                nome: usuario.nome,
                email: usuario.email,
                senha: '',
                perfil: usuario.perfil,
                setor_id: usuario.setor?.id || ''
            });
        } else {
            setEditando(null);
            setFormData({
                nome: '',
                email: '',
                senha: '',
                perfil: 'usuario',
                setor_id: ''
            });
        }
        setModalAberto(true);
    }

    function fecharModal() {
        setModalAberto(false);
        setEditando(null);
        setFormData({
            nome: '',
            email: '',
            senha: '',
            perfil: 'usuario',
            setor_id: ''
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!formData.nome || !formData.email || !formData.perfil) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        if (!editando && !formData.senha) {
            toast.error('Senha é obrigatória para novo usuário');
            return;
        }

        try {
            const dados = { ...formData };
            if (!dados.senha) delete dados.senha;
            if (!dados.setor_id) dados.setor_id = null;

            if (editando) {
                await api.put(`/usuarios/${editando.id}`, dados);
                toast.success('Usuário atualizado com sucesso!');
            } else {
                await api.post('/usuarios', dados);
                toast.success('Usuário criado com sucesso!');
            }

            fecharModal();
            carregarDados();
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao salvar usuário');
        }
    }

    async function handleDeletar(usuario) {
        if (!confirm(`Deseja realmente excluir o usuário "${usuario.nome}"?`)) {
            return;
        }

        try {
            await api.delete(`/usuarios/${usuario.id}`);
            toast.success('Usuário excluído com sucesso!');
            carregarDados();
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao excluir usuário');
        }
    }

    function getPerfilLabel(perfil) {
        const labels = {
            'admin': 'Administrador',
            'operador': 'Operador',
            'usuario': 'Usuário',
            'consulta': 'Consulta'
        };
        return labels[perfil] || perfil;
    }

    function formatarData(data) {
        return new Date(data).toLocaleDateString('pt-BR');
    }

    if (loading) {
        return <div className="loading">Carregando...</div>;
    }

    return (
        <div className="usuarios-page">
            <div className="page-header">
                <h1>Usuários</h1>
                <button className="btn btn-primary" onClick={() => abrirModal()}>
                    <FiPlus /> Novo Usuário
                </button>
            </div>

            <div className="card">
                {usuarios.length === 0 ? (
                    <p className="empty-message">Nenhum usuário encontrado</p>
                ) : (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>Perfil</th>
                                    <th>Setor</th>
                                    <th>Status</th>
                                    <th>Criado em</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map((usuario) => (
                                    <tr key={usuario.id}>
                                        <td>{usuario.nome}</td>
                                        <td>{usuario.email}</td>
                                        <td>
                                            <span className={`badge badge-perfil-${usuario.perfil}`}>
                                                {getPerfilLabel(usuario.perfil)}
                                            </span>
                                        </td>
                                        <td>{usuario.setor?.sigla || '-'}</td>
                                        <td>
                                            <span className={`badge ${usuario.ativo ? 'badge-ativo' : 'badge-inativo'}`}>
                                                {usuario.ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td>{formatarData(usuario.criado_em)}</td>
                                        <td>
                                            <div className="acoes">
                                                <button 
                                                    className="btn-acao btn-editar" 
                                                    onClick={() => abrirModal(usuario)}
                                                    title="Editar"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button 
                                                    className="btn-acao btn-excluir" 
                                                    onClick={() => handleDeletar(usuario)}
                                                    title="Excluir"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalAberto && (
                <div className="modal-overlay" onClick={fecharModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editando ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                            <button className="modal-close" onClick={fecharModal}>
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nome *</label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    placeholder="Nome completo"
                                />
                            </div>

                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@exemplo.com"
                                />
                            </div>

                            <div className="form-group">
                                <label>{editando ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}</label>
                                <input
                                    type="password"
                                    value={formData.senha}
                                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="form-group">
                                <label>Perfil *</label>
                                <select
                                    value={formData.perfil}
                                    onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
                                >
                                    <option value="admin">Administrador</option>
                                    <option value="operador">Operador</option>
                                    <option value="usuario">Usuário</option>
                                    <option value="consulta">Consulta</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Setor</label>
                                <select
                                    value={formData.setor_id}
                                    onChange={(e) => setFormData({ ...formData, setor_id: e.target.value })}
                                >
                                    <option value="">Selecione um setor</option>
                                    {setores.map((setor) => (
                                        <option key={setor.id} value={setor.id}>
                                            {setor.sigla} - {setor.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {editando && (
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={formData.ativo !== undefined ? formData.ativo : true}
                                        onChange={(e) => setFormData({ ...formData, ativo: e.target.value === 'true' })}
                                    >
                                        <option value="true">Ativo</option>
                                        <option value="false">Inativo</option>
                                    </select>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={fecharModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editando ? 'Salvar' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Usuarios;