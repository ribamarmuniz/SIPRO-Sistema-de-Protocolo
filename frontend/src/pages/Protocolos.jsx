import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiFileText, FiEye, FiX, FiUpload, FiPaperclip, FiTrash } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import './Protocolos.css';

function Protocolos() {
    const [protocolos, setProtocolos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [setores, setSetores] = useState([]);
    const [tiposDocumento, setTiposDocumento] = useState([]);
    
    // Capturar estado vindo da Home
    const location = useLocation();

    // Filtros
    const [busca, setBusca] = useState('');
    const [status, setStatus] = useState('');
    const [setorDestino, setSetorDestino] = useState('');
    const [tipoDocumento, setTipoDocumento] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    // Novo Protocolo
    const [novoAssunto, setNovoAssunto] = useState('');
    const [novoDescricao, setNovoDescricao] = useState('');
    const [novoTipo, setNovoTipo] = useState('');
    const [novoSetorDestino, setNovoSetorDestino] = useState('');
    const [novoArquivo, setNovoArquivo] = useState(null);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        carregarProtocolos();
        carregarDadosAuxiliares();
        
        // Se veio da Home clicando em "Novo Protocolo", abre o modal
        if (location.state?.abrirModal) {
            setModalAberto(true);
            // Limpa o state para não abrir de novo ao recarregar
            window.history.replaceState({}, document.title);
        }
    }, [status, setorDestino, tipoDocumento, dataInicio, dataFim]);

    async function carregarProtocolos(filtrosPersonalizados = null) {
        setLoading(true);
        try {
            let params = {};
            if (filtrosPersonalizados) {
                params = filtrosPersonalizados;
            } else {
                params = { status, setor_destino_id: setorDestino, tipo_documento_id: tipoDocumento, data_inicio: dataInicio, data_fim: dataFim, busca };
            }
            const response = await api.get('/protocolos', { params });
            setProtocolos(response.data);
        } catch (error) {
            toast.error('Erro ao carregar protocolos');
        } finally {
            setLoading(false);
        }
    }

    async function carregarDadosAuxiliares() {
        try {
            const [setoresRes, tiposRes] = await Promise.all([
                api.get('/setores'),
                api.get('/tipos-documento')
            ]);
            setSetores(setoresRes.data);
            setTiposDocumento(tiposRes.data);
        } catch (error) {
            console.error('Erro:', error);
        }
    }

    function handleBuscar(e) {
        e.preventDefault();
        carregarProtocolos();
    }

    function limparFiltros() {
        setBusca('');
        setStatus('');
        setSetorDestino('');
        setTipoDocumento('');
        setDataInicio('');
        setDataFim('');
        carregarProtocolos({ busca: '', status: '', setor_destino_id: '', tipo_documento_id: '', data_inicio: '', data_fim: '' });
    }

    async function handleCriarProtocolo(e) {
        e.preventDefault();
        if (!novoAssunto || !novoTipo || !novoSetorDestino) {
            toast.warning('Preencha os campos obrigatórios');
            return;
        }
        setEnviando(true);
        try {
            const formData = new FormData();
            formData.append('assunto', novoAssunto);
            formData.append('descricao', novoDescricao);
            formData.append('tipo_documento_id', novoTipo);
            formData.append('setor_destino_id', novoSetorDestino);
            if (novoArquivo) formData.append('arquivo', novoArquivo);

            await api.post('/protocolos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Protocolo criado com sucesso!');
            setModalAberto(false);
            limparFormularioNovo();
            carregarProtocolos();
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao criar protocolo');
        } finally {
            setEnviando(false);
        }
    }

    function limparFormularioNovo() {
        setNovoAssunto('');
        setNovoDescricao('');
        setNovoTipo('');
        setNovoSetorDestino('');
        setNovoArquivo(null);
    }

    function getStatusLabel(status) {
        const labels = { 'aguardando': 'Aguardando', 'em_transito': 'Em Trânsito', 'recebido': 'Recebido', 'arquivado': 'Arquivado' };
        return labels[status] || status;
    }

    function formatarData(data) {
        return new Date(data).toLocaleDateString('pt-BR');
    }

    return (
        <div className="protocolos-page">
            <div className="page-header">
                <div className="header-titulo">
                    <FiFileText className="header-icon" />
                    <div>
                        <h1>Protocolos</h1>
                        <p>Gerencie e acompanhe os protocolos do sistema</p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setModalAberto(true)}>
                    <FiPlus /> Novo Protocolo
                </button>
            </div>

            {/* Container unificado de Filtros e Busca */}
            <div className="filtros-wrapper card">
                <div className="busca-header">
                    <form onSubmit={handleBuscar} className="busca-form">
                        <div className="busca-input-wrapper">
                            <FiSearch className="busca-icon" />
                            <input
                                type="text"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                placeholder="Pesquisar protocolo..."
                            />
                        </div>
                        <button type="submit" className="btn btn-secondary">Buscar</button>
                    </form>
                    <button className="btn btn-outline btn-limpar" onClick={limparFiltros}>
                        <FiFilter /> Limpar
                    </button>
                </div>

                <div className="filtros-opcoes">
                    <div className="filtro-group">
                        <label>Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="">Todos</option>
                            <option value="aguardando">Aguardando</option>
                            <option value="em_transito">Em Trânsito</option>
                            <option value="recebido">Recebido</option>
                            <option value="arquivado">Arquivado</option>
                        </select>
                    </div>
                    <div className="filtro-group">
                        <label>Tipo</label>
                        <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)}>
                            <option value="">Todos</option>
                            {tiposDocumento.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                        </select>
                    </div>
                    <div className="filtro-group">
                        <label>Destino</label>
                        <select value={setorDestino} onChange={(e) => setSetorDestino(e.target.value)}>
                            <option value="">Todos</option>
                            {setores.map(s => <option key={s.id} value={s.id}>{s.sigla}</option>)}
                        </select>
                    </div>
                    <div className="filtro-group">
                        <label>Início</label>
                        <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                    </div>
                    <div className="filtro-group">
                        <label>Fim</label>
                        <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="lista-protocolos card">
                {loading ? <p className="loading-text">Carregando...</p> : protocolos.length === 0 ? <p className="empty-text">Nenhum protocolo encontrado.</p> : (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Número</th>
                                    <th>Tipo</th>
                                    <th>Assunto</th>
                                    <th>Origem</th>
                                    <th>Destino</th>
                                    <th>Status</th>
                                    <th>Data</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {protocolos.map((p) => (
                                    <tr key={p.id}>
                                        <td><span className="numero-protocolo">{p.numero_protocolo}</span></td>
                                        <td>{p.tipo_documento_nome}</td>
                                        <td>{p.assunto}</td>
                                        <td><span className="setor-badge">{p.setor_origem_sigla}</span></td>
                                        <td><span className="setor-badge destino">{p.setor_destino_sigla}</span></td>
                                        <td><span className={`badge badge-${p.status}`}>{getStatusLabel(p.status)}</span></td>
                                        <td>{formatarData(p.criado_em)}</td>
                                        <td>
                                            <Link to={`/protocolos/${p.id}`} className="btn-acao btn-visualizar"><FiEye /></Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal com Novo Estilo de Upload */}
            {modalAberto && (
                <div className="modal-overlay">
                    <div className="modal modal-lg">
                        <div className="modal-header">
                            <h2>Novo Protocolo</h2>
                            <button className="btn-close" onClick={() => setModalAberto(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleCriarProtocolo}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Assunto *</label>
                                    <input type="text" value={novoAssunto} onChange={(e) => setNovoAssunto(e.target.value)} placeholder="Ex: Solicitação de Material" required />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Tipo de Documento *</label>
                                        <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} required>
                                            <option value="">Selecione...</option>
                                            {tiposDocumento.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Setor de Destino *</label>
                                        <select value={novoSetorDestino} onChange={(e) => setNovoSetorDestino(e.target.value)} required>
                                            <option value="">Selecione...</option>
                                            {setores.map(s => <option key={s.id} value={s.id}>{s.sigla} - {s.nome}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Descrição</label>
                                    <textarea value={novoDescricao} onChange={(e) => setNovoDescricao(e.target.value)} rows="4" placeholder="Detalhes adicionais..."></textarea>
                                </div>
                                
                                {/* Novo Componente de Upload Bonito */}
                                <div className="form-group">
                                    <label>Anexar Arquivo (Opcional)</label>
                                    
                                    {!novoArquivo ? (
                                        <div className="upload-area">
                                            <input 
                                                type="file" 
                                                id="file-upload" 
                                                className="hidden-input"
                                                onChange={(e) => setNovoArquivo(e.target.files[0])}
                                            />
                                            <label htmlFor="file-upload" className="upload-label">
                                                <div className="upload-icon">
                                                    <FiUpload />
                                                </div>
                                                <div className="upload-text">
                                                    <p>Clique para selecionar um arquivo</p>
                                                    <span>PDF, DOCX, JPG ou PNG (Máx 10MB)</span>
                                                </div>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="arquivo-selecionado">
                                            <div className="arquivo-info">
                                                <div className="arquivo-icone">
                                                    <FiPaperclip />
                                                </div>
                                                <div className="arquivo-detalhes">
                                                    <span className="arquivo-nome">{novoArquivo.name}</span>
                                                    <span className="arquivo-tamanho">{(novoArquivo.size / 1024).toFixed(1)} KB</span>
                                                </div>
                                            </div>
                                            <button 
                                                type="button" 
                                                className="btn-remover-arquivo"
                                                onClick={() => setNovoArquivo(null)}
                                                title="Remover arquivo"
                                            >
                                                <FiTrash />
                                            </button>
                                        </div>
                                    )}
                                </div>

                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Enviando...' : 'Criar Protocolo'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Protocolos;