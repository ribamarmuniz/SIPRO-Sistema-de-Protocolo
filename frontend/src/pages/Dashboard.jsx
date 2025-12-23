import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiClock, FiCheckCircle, FiArchive } from 'react-icons/fi';
import { 
    PieChart, Pie, Cell, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

function Dashboard() {
    const { usuario } = useAuth();
    const [stats, setStats] = useState({
        totalProtocolos: 0,
        emTransito: 0,
        recebidos: 0,
        arquivados: 0
    });
    const [protocolosRecentes, setProtocolosRecentes] = useState([]);
    const [graficoStatus, setGraficoStatus] = useState([]);
    const [graficoSetores, setGraficoSetores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        try {
            const response = await api.get('/protocolos');
            const protocolos = response.data;

            // 1. Estatísticas dos Cards
            const aguardando = protocolos.filter(p => p.status === 'aguardando').length;
            const emTransito = protocolos.filter(p => p.status === 'em_transito').length;
            const recebidos = protocolos.filter(p => p.status === 'recebido').length;
            const arquivados = protocolos.filter(p => p.status === 'arquivado').length;

            setStats({
                totalProtocolos: protocolos.length,
                emTransito,
                recebidos,
                arquivados
            });

            // 2. Dados para o Gráfico de Pizza (Status)
            const dadosPizza = [
                { name: 'Aguardando', value: aguardando, color: '#f0ad4e' },
                { name: 'Em Trânsito', value: emTransito, color: '#337ab7' },
                { name: 'Recebidos', value: recebidos, color: '#5cb85c' },
                { name: 'Arquivados', value: arquivados, color: '#777777' },
            ].filter(item => item.value > 0); // Só mostra o que tem dados
            
            setGraficoStatus(dadosPizza);

            // 3. Dados para o Gráfico de Barras (Top 5 Setores de Destino)
            const contadorSetores = {};
            protocolos.forEach(p => {
                // Conta quantas vezes cada setor aparece como destino
                const sigla = p.setor_destino_sigla || 'Indefinido';
                contadorSetores[sigla] = (contadorSetores[sigla] || 0) + 1;
            });

            const dadosBarras = Object.entries(contadorSetores)
                .map(([name, quantidade]) => ({ name, quantidade }))
                .sort((a, b) => b.quantidade - a.quantidade) // Ordena do maior para o menor
                .slice(0, 5); // Pega só os top 5

            setGraficoSetores(dadosBarras);

            // 4. Lista Recente
            setProtocolosRecentes(protocolos.slice(0, 5));

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
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

    if (loading) {
        return <div className="loading">Carregando dashboard...</div>;
    }

    return (
        <div className="dashboard">
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="welcome-text">Bem-vindo(a), {usuario?.nome}!</p>
                </div>
                {/* Link com state para abrir modal na outra página */}
                <Link to="/protocolos" state={{ abrirModal: true }} className="btn btn-primary">
                    <FiFileText /> Novo Protocolo
                </Link>
            </div>

            {/* Cards de estatísticas (Mantidos) */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <FiFileText />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalProtocolos}</span>
                        <span className="stat-label">Total de Protocolos</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon yellow">
                        <FiClock />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.emTransito}</span>
                        <span className="stat-label">Em Trânsito</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">
                        <FiCheckCircle />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.recebidos}</span>
                        <span className="stat-label">Recebidos</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon gray">
                        <FiArchive />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.arquivados}</span>
                        <span className="stat-label">Arquivados</span>
                    </div>
                </div>
            </div>

            {/* SEÇÃO DE GRÁFICOS (NOVO) */}
            <div className="charts-section">
                {/* Gráfico 1: Status */}
                <div className="card chart-card">
                    <h3>Status dos Protocolos</h3>
                    <div className="chart-container">
                        {graficoStatus.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={graficoStatus}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {graficoStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="empty-chart">Sem dados suficientes</p>
                        )}
                    </div>
                </div>

                {/* Gráfico 2: Volume por Setor */}
                <div className="card chart-card">
                    <h3>Volume por Setor de Destino (Top 5)</h3>
                    <div className="chart-container">
                        {graficoSetores.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={graficoSetores} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis dataKey="name" type="category" width={80} />
                                    <RechartsTooltip cursor={{ fill: '#f5f5f5' }} />
                                    <Bar dataKey="quantidade" fill="#337ab7" radius={[0, 4, 4, 0]} barSize={20} name="Qtd. Protocolos" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="empty-chart">Sem dados suficientes</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Protocolos recentes */}
            <div className="card">
                <div className="card-header">
                    <h2>Protocolos Recentes</h2>
                    <Link to="/protocolos" className="btn btn-outline">
                        Ver todos
                    </Link>
                </div>

                {protocolosRecentes.length === 0 ? (
                    <p className="empty-message">Nenhum protocolo encontrado</p>
                ) : (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Número</th>
                                    <th>Assunto</th>
                                    <th>Destino</th>
                                    <th>Status</th>
                                    <th>Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {protocolosRecentes.map((protocolo) => (
                                    <tr key={protocolo.id}>
                                        <td>
                                            <Link to={`/protocolos/${protocolo.id}`} className="link-protocolo">
                                                {protocolo.numero_protocolo}
                                            </Link>
                                        </td>
                                        <td>{protocolo.assunto}</td>
                                        <td>{protocolo.setor_destino_sigla}</td>
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
        </div>
    );
}

export default Dashboard;