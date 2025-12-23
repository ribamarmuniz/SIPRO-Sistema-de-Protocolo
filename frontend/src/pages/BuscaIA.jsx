import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiCpu, FiEye, FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import './BuscaIA.css';

function BuscaIA() {
    const [pergunta, setPergunta] = useState('');
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [sugestoes, setSugestoes] = useState([]);
    const [historico, setHistorico] = useState([]);

    useEffect(() => {
        carregarSugestoes();
    }, []);

    async function carregarSugestoes() {
        try {
            const response = await api.get('/ia/sugestoes');
            setSugestoes(response.data.sugestoes);
        } catch (error) {
            console.error('Erro ao carregar sugestões:', error);
        }
    }

    async function handleBuscar(e) {
        e.preventDefault();

        if (!pergunta.trim()) {
            toast.error('Digite uma pergunta');
            return;
        }

        setLoading(true);
        setResultado(null);

        try {
            const response = await api.post('/ia/buscar', { pergunta });
            setResultado(response.data);
            
            // Adicionar ao histórico
            setHistorico(prev => [pergunta, ...prev.slice(0, 4)]);
            
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao processar busca');
        } finally {
            setLoading(false);
        }
    }

    function handleSugestaoClick(sugestao) {
        setPergunta(sugestao);
    }

    function formatarData(data) {
        return new Date(data).toLocaleDateString('pt-BR');
    }

    function getStatusLabel(status) {
        const labels = {
            'aguardando': 'Aguardando',
            'em_transito': 'Em Trânsito',
            'recebido': 'Recebido',
            'arquivado': 'Arquivado'
        };
        return labels[status] || status;
    }

    return (
        <div className="busca-ia-page">
            <div className="page-header">
                <div className="header-titulo">
                    <FiCpu className="header-icon" />
                    <div>
                        <h1>Busca Inteligente</h1>
                        <p>Pesquise protocolos usando linguagem natural</p>
                    </div>
                </div>
            </div>

            {/* Barra de busca */}
            <div className="busca-container">
                <form onSubmit={handleBuscar} className="busca-form">
                    <div className="busca-input-wrapper">
                        <FiMessageSquare className="busca-icon" />
                        <input
                            type="text"
                            value={pergunta}
                            onChange={(e) => setPergunta(e.target.value)}
                            placeholder="Faça uma pergunta... Ex: Mostre protocolos em trânsito para o DCOMP"
                            disabled={loading}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-buscar" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Processando...
                            </>
                        ) : (
                            <>
                                <FiSearch /> Buscar
                            </>
                        )}
                    </button>
                </form>

                {/* Sugestões */}
                <div className="sugestoes">
                    <span className="sugestoes-label">Sugestões:</span>
                    <div className="sugestoes-list">
                        {sugestoes.map((sugestao, index) => (
                            <button
                                key={index}
                                className="sugestao-chip"
                                onClick={() => handleSugestaoClick(sugestao)}
                                disabled={loading}
                            >
                                {sugestao}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Resultado */}
            {resultado && (
                <div className="resultado-container">
                    {resultado.sucesso ? (
                        <>
                            {/* Explicação da IA */}
                            <div className="resultado-explicacao">
                                <FiCpu className="explicacao-icon" />
                                <div>
                                    <strong>Entendi sua pergunta:</strong>
                                    <p>{resultado.explicacao}</p>
                                </div>
                            </div>

                            {/* Filtros aplicados */}
                            <div className="filtros-aplicados">
                                <span className="filtros-label">Filtros aplicados:</span>
                                <div className="filtros-chips">
                                    {resultado.filtrosAplicados.status && (
                                        <span className="filtro-chip">
                                            Status: {getStatusLabel(resultado.filtrosAplicados.status)}
                                        </span>
                                    )}
                                    {resultado.filtrosAplicados.busca && (
                                        <span className="filtro-chip">
                                            Busca: "{resultado.filtrosAplicados.busca}"
                                        </span>
                                    )}
                                    {resultado.filtrosAplicados.data_inicio && (
                                        <span className="filtro-chip">
                                            A partir de: {resultado.filtrosAplicados.data_inicio}
                                        </span>
                                    )}
                                    {resultado.filtrosAplicados.data_fim && (
                                        <span className="filtro-chip">
                                            Até: {resultado.filtrosAplicados.data_fim}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Resultados */}
                            <div className="card">
                                <div className="resultado-header">
                                    <h3>Resultados encontrados</h3>
                                    <span className="resultado-count">{resultado.totalResultados} protocolo(s)</span>
                                </div>

                                {resultado.resultados.length === 0 ? (
                                    <p className="empty-message">Nenhum protocolo encontrado para esta busca</p>
                                ) : (
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
                                                {resultado.resultados.map((protocolo) => (
                                                    <tr key={protocolo.id}>
                                                        <td>
                                                            <span className="numero-protocolo">
                                                                {protocolo.numero_protocolo}
                                                            </span>
                                                        </td>
                                                        <td>{protocolo.tipo_documento_nome}</td>
                                                        <td className="assunto-cell">{protocolo.assunto}</td>
                                                        <td>
                                                            <span className="setor-badge">{protocolo.setor_origem_sigla}</span>
                                                        </td>
                                                        <td>
                                                            <span className="setor-badge destino">{protocolo.setor_destino_sigla}</span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge badge-${protocolo.status}`}>
                                                                {getStatusLabel(protocolo.status)}
                                                            </span>
                                                        </td>
                                                        <td>{formatarData(protocolo.criado_em)}</td>
                                                        <td>
                                                            <Link 
                                                                to={`/protocolos/${protocolo.id}`} 
                                                                className="btn-acao btn-visualizar"
                                                                title="Visualizar"
                                                            >
                                                                <FiEye />
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="resultado-erro">
                            <p>{resultado.erro}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Histórico */}
            {historico.length > 0 && !loading && (
                <div className="historico">
                    <span className="historico-label">Buscas recentes:</span>
                    <div className="historico-list">
                        {historico.map((item, index) => (
                            <button
                                key={index}
                                className="historico-item"
                                onClick={() => handleSugestaoClick(item)}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default BuscaIA;