import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Setores.css';

function Setores() {
    const { usuario } = useAuth();
    const [setores, setSetores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [modalAberto, setModalAberto] = useState(false);
    const [editando, setEditando] = useState(null);
    const [formData, setFormData] = useState({
        nome: '',
        sigla: '',
        descricao: ''
    });

    const isAdmin = usuario?.perfil === 'admin';

    useEffect(() => {
        carregarSetores();
    }, []);

    async function carregarSetores() {
        try {
            const response = await api.get('/setores');
            setSetores(response.data);
        } catch (error) {
            toast.error('Erro ao carregar setores');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function abrirModal(setor = null) {
        if (setor) {
            setEditando(setor);
            setFormData({
                nome: setor.nome,
                sigla: setor.sigla,
                descricao: setor.descricao || ''
            });
        } else {
            setEditando(null);
            setFormData({
                nome: '',
                sigla: '',
                descricao: ''
            });
        }
        setModalAberto(true);
    }

    function fecharModal() {
        setModalAberto(false);
        setEditando(null);
        setFormData({
            nome: '',
            sigla: '',
            descricao: ''
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!formData.nome || !formData.sigla) {
            toast.error('Nome e sigla são obrigatórios');
            return;
        }

        try {
            if (editando) {
                await api.put(`/setores/${editando.id}`, formData);
                toast.success('Setor atualizado com sucesso!');
            } else {
                await api.post('/setores', formData);
                toast.success('Setor criado com sucesso!');
            }

            fecharModal();
            carregarSetores();
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao salvar setor');
        }
    }

    async function handleDeletar(setor) {
        if (!confirm(`Deseja realmente excluir o setor "${setor.nome}"?`)) {
            return;
        }

        try {
            await api.delete(`/setores/${setor.id}`);
            toast.success('Setor excluído com sucesso!');
            carregarSetores();
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao excluir setor');
        }
    }

    // Filtrar setores pela busca
    const setoresFiltrados = setores.filter(setor => 
        setor.nome.toLowerCase().includes(busca.toLowerCase()) ||
        setor.sigla.toLowerCase().includes(busca.toLowerCase())
    );

    if (loading) {
        return <div className="loading">Carregando...</div>;
    }

    return (
        <div className="setores-page">
            <div className="page-header">
                <h1>Setores</h1>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => abrirModal()}>
                        <FiPlus /> Novo Setor
                    </button>
                )}
            </div>

            {/* Barra de busca */}
            <div className="search-bar">
                <FiSearch className="search-icon" />
                <input
                    type="text"
                    placeholder="Buscar por nome ou sigla..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
            </div>

            {/* Cards de setores */}
            <div className="setores-grid">
                {setoresFiltrados.length === 0 ? (
                    <p className="empty-message">Nenhum setor encontrado</p>
                ) : (
                    setoresFiltrados.map((setor) => (
                        <div key={setor.id} className="setor-card">
                            <div className="setor-header">
                                <span className="setor-sigla">{setor.sigla}</span>
                                {isAdmin && (
                                    <div className="setor-acoes">
                                        <button 
                                            className="btn-acao btn-editar" 
                                            onClick={() => abrirModal(setor)}
                                            title="Editar"
                                        >
                                            <FiEdit2 />
                                        </button>
                                        <button 
                                            className="btn-acao btn-excluir" 
                                            onClick={() => handleDeletar(setor)}
                                            title="Excluir"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <h3 className="setor-nome">{setor.nome}</h3>
                            {setor.descricao && (
                                <p className="setor-descricao">{setor.descricao}</p>
                            )}
                            <div className="setor-status">
                                <span className={`badge ${setor.ativo ? 'badge-ativo' : 'badge-inativo'}`}>
                                    {setor.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {modalAberto && (
                <div className="modal-overlay" onClick={fecharModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editando ? 'Editar Setor' : 'Novo Setor'}</h2>
                            <button className="modal-close" onClick={fecharModal}>
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Sigla *</label>
                                <input
                                    type="text"
                                    value={formData.sigla}
                                    onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                                    placeholder="Ex: DCOMP"
                                    maxLength={10}
                                />
                            </div>

                            <div className="form-group">
                                <label>Nome *</label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    placeholder="Ex: Departamento de Engenharia da Computação"
                                />
                            </div>

                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    placeholder="Descrição do setor (opcional)"
                                    rows={3}
                                />
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

export default Setores;