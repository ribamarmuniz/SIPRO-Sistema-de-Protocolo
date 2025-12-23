import { useState, useRef } from 'react';
import { FiCalendar, FiFileText, FiDownload, FiPrinter, FiClock, FiCheckCircle, FiArchive, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import './Relatorios.css';

function Relatorios() {
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [loading, setLoading] = useState(false);
    const [relatorio, setRelatorio] = useState(null);
    const relatorioRef = useRef(null);

    async function gerarRelatorio() {
        if (!dataInicio || !dataFim) {
            toast.error('Selecione o período completo');
            return;
        }

        if (new Date(dataInicio) > new Date(dataFim)) {
            toast.error('Data inicial não pode ser maior que a final');
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/relatorios', {
                params: { data_inicio: dataInicio, data_fim: dataFim }
            });
            setRelatorio(response.data);
            toast.success('Relatório gerado com sucesso!');
        } catch (error) {
            toast.error('Erro ao gerar relatório');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function formatarData(data) {
        return new Date(data).toLocaleDateString('pt-BR');
    }

    function formatarDataHora(data) {
        return new Date(data).toLocaleString('pt-BR');
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

    function imprimirRelatorio() {
        window.print();
    }

    function definirPeriodoRapido(tipo) {
        const hoje = new Date();
        let inicio, fim;

        switch (tipo) {
            case 'hoje':
                inicio = fim = hoje.toISOString().split('T')[0];
                break;
            case 'semana':
                const inicioSemana = new Date(hoje);
                inicioSemana.setDate(hoje.getDate() - hoje.getDay());
                inicio = inicioSemana.toISOString().split('T')[0];
                fim = hoje.toISOString().split('T')[0];
                break;
            case 'mes':
                inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
                fim = hoje.toISOString().split('T')[0];
                break;
            case 'ano':
                inicio = new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0];
                fim = hoje.toISOString().split('T')[0];
                break;
            default:
                return;
        }

        setDataInicio(inicio);
        setDataFim(fim);
    }

    return (
        <div className="relatorios-page">
            <div className="page-header">
                <h1>Relatórios</h1>
            </div>

            {/* Filtros */}
            <div className="card filtros-relatorio">
                <h3>Selecione o Período</h3>
                
                <div className="periodo-rapido">
                    <button onClick={() => definirPeriodoRapido('hoje')} className="btn btn-outline btn-sm">
                        Hoje
                    </button>
                    <button onClick={() => definirPeriodoRapido('semana')} className="btn btn-outline btn-sm">
                        Esta Semana
                    </button>
                    <button onClick={() => definirPeriodoRapido('mes')} className="btn btn-outline btn-sm">
                        Este Mês
                    </button>
                    <button onClick={() => definirPeriodoRapido('ano')} className="btn btn-outline btn-sm">
                        Este Ano
                    </button>
                </div>

                <div className="filtros-datas">
                    <div className="form-group">
                        <label><FiCalendar /> Data Início</label>
                        <input
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label><FiCalendar /> Data Fim</label>
                        <input
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                        />
                    </div>
                    <button 
                        className="btn btn-primary btn-gerar"
                        onClick={gerarRelatorio}
                        disabled={loading}
                    >
                        {loading ? 'Gerando...' : 'Gerar Relatório'}
                    </button>
                </div>
            </div>

            {/* Resultado do Relatório */}
            {relatorio && (
                <div className="relatorio-resultado" ref={relatorioRef}>
                    {/* Cabeçalho do Relatório */}
                    <div className="relatorio-header">
                        <div className="relatorio-titulo">
                            <h2>Relatório de Protocolos</h2>
                            <p>Período: {formatarData(relatorio.periodo.data_inicio)} a {formatarData(relatorio.periodo.data_fim)}</p>
                        </div>
                        <div className="relatorio-acoes no-print">
                            <button className="btn btn-outline" onClick={imprimirRelatorio}>
                                <FiPrinter /> Imprimir
                            </button>
                        </div>
                    </div>

                    {/* Cards de Resumo */}
                    <div className="resumo-cards">
                        <div className="resumo-card total">
                            <div className="resumo-icon">
                                <FiFileText />
                            </div>
                            <div className="resumo-info">
                                <span className="resumo-valor">{relatorio.resumo.total}</span>
                                <span className="resumo-label">Total de Protocolos</span>
                            </div>
                        </div>
                        <div className="resumo-card aguardando">
                            <div className="resumo-icon">
                                <FiClock />
                            </div>
                            <div className="resumo-info">
                                <span className="resumo-valor">{relatorio.resumo.aguardando}</span>
                                <span className="resumo-label">Aguardando</span>
                            </div>
                        </div>
                        <div className="resumo-card em-transito">
                            <div className="resumo-icon">
                                <FiTrendingUp />
                            </div>
                            <div className="resumo-info">
                                <span className="resumo-valor">{relatorio.resumo.em_transito}</span>
                                <span className="resumo-label">Em Trânsito</span>
                            </div>
                        </div>
                        <div className="resumo-card recebido">
                            <div className="resumo-icon">
                                <FiCheckCircle />
                            </div>
                            <div className="resumo-info">
                                <span className="resumo-valor">{relatorio.resumo.recebido}</span>
                                <span className="resumo-label">Recebidos</span>
                            </div>
                        </div>
                        <div className="resumo-card arquivado">
                            <div className="resumo-icon">
                                <FiArchive />
                            </div>
                            <div className="resumo-info">
                                <span className="resumo-valor">{relatorio.resumo.arquivado}</span>
                                <span className="resumo-label">Arquivados</span>
                            </div>
                        </div>
                    </div>

                    {/* Gráficos em Grid */}
                    <div className="graficos-grid">
                        {/* Por Setor Destino */}
                        <div className="card grafico-card">
                            <h3>Protocolos por Setor de Destino</h3>
                            {relatorio.porSetorDestino.length === 0 ? (
                                <p className="empty-message">Nenhum dado disponível</p>
                            ) : (
                                <div className="barras-container">
                                    {relatorio.porSetorDestino.map((item, index) => {
                                        const maxValor = Math.max(...relatorio.porSetorDestino.map(i => i.quantidade));
                                        const percentual = (item.quantidade / maxValor) * 100;
                                        return (
                                            <div key={index} className="barra-item">
                                                <div className="barra-label">
                                                    <span className="barra-setor">{item.setor}</span>
                                                    <span className="barra-valor">{item.quantidade}</span>
                                                </div>
                                                <div className="barra-track">
                                                    <div 
                                                        className="barra-fill" 
                                                        style={{ width: `${percentual}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Por Tipo de Documento */}
                        <div className="card grafico-card">
                            <h3>Protocolos por Tipo de Documento</h3>
                            {relatorio.porTipoDocumento.length === 0 ? (
                                <p className="empty-message">Nenhum dado disponível</p>
                            ) : (
                                <div className="barras-container">
                                    {relatorio.porTipoDocumento.map((item, index) => {
                                        const maxValor = Math.max(...relatorio.porTipoDocumento.map(i => i.quantidade));
                                        const percentual = (item.quantidade / maxValor) * 100;
                                        return (
                                            <div key={index} className="barra-item">
                                                <div className="barra-label">
                                                    <span className="barra-setor">{item.tipo}</span>
                                                    <span className="barra-valor">{item.quantidade}</span>
                                                </div>
                                                <div className="barra-track">
                                                    <div 
                                                        className="barra-fill tipo" 
                                                        style={{ width: `${percentual}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Por Setor Origem */}
                    <div className="card grafico-card">
                        <h3>Protocolos por Setor de Origem</h3>
                        {relatorio.porSetorOrigem.length === 0 ? (
                            <p className="empty-message">Nenhum dado disponível</p>
                        ) : (
                            <div className="barras-container horizontal">
                                {relatorio.porSetorOrigem.map((item, index) => {
                                    const maxValor = Math.max(...relatorio.porSetorOrigem.map(i => i.quantidade));
                                    const percentual = (item.quantidade / maxValor) * 100;
                                    return (
                                        <div key={index} className="barra-item">
                                            <div className="barra-label">
                                                <span className="barra-setor">{item.setor}</span>
                                                <span className="barra-valor">{item.quantidade}</span>
                                            </div>
                                            <div className="barra-track">
                                                <div 
                                                    className="barra-fill origem" 
                                                    style={{ width: `${percentual}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Tabela Detalhada */}
                    <div className="card">
                        <h3>Lista Detalhada de Protocolos ({relatorio.protocolos.length})</h3>
                        {relatorio.protocolos.length === 0 ? (
                            <p className="empty-message">Nenhum protocolo encontrado no período</p>
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {relatorio.protocolos.map((protocolo) => (
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
                                                    <span className="setor-badge">{protocolo.setor_destino_sigla}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge badge-${protocolo.status}`}>
                                                        {getStatusLabel(protocolo.status)}
                                                    </span>
                                                </td>
                                                <td>{formatarData(protocolo.criado_em)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Rodapé do Relatório */}
                    <div className="relatorio-footer">
                        <p>Relatório gerado em {formatarDataHora(new Date())}</p>
                        <p>Sistema de Protocolo Geral - PROG | UEMA</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Relatorios;