import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    FiArrowLeft, 
    FiSend, 
    FiCheck, 
    FiArchive, 
    FiTrash2, 
    FiDownload,
    FiX,
    FiEye,
    FiCopy,
    FiPrinter,
    FiRefreshCw
} from 'react-icons/fi';
import { BsQrCode } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './ProtocoloDetalhes.css';

function ProtocoloDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { usuario } = useAuth();
    
    const [protocolo, setProtocolo] = useState(null);
    const [setores, setSetores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalTramitar, setModalTramitar] = useState(false);
    const [modalQRCode, setModalQRCode] = useState(false);
    const [modalVisualizar, setModalVisualizar] = useState(false);
    
    // === ESTADOS DA ASSINATURA DIGITAL ===
    const [modalAssinatura, setModalAssinatura] = useState(false);
    const [senhaAssinatura, setSenhaAssinatura] = useState('');
    // =====================================

    const [qrCodeData, setQrCodeData] = useState(null);
    const [gerandoPDF, setGerandoPDF] = useState(false);

    const [tramitarForm, setTramitarForm] = useState({
        setor_destino_id: '',
        observacao: ''
    });

    useEffect(() => {
        carregarDados();
    }, [id]);

    async function carregarDados() {
        try {
            const [protocoloRes, setoresRes] = await Promise.all([
                api.get(`/protocolos/${id}`),
                api.get('/setores')
            ]);
            setProtocolo(protocoloRes.data);
            setSetores(setoresRes.data);
        } catch (error) {
            toast.error('Erro ao carregar protocolo');
            navigate('/protocolos');
        } finally {
            setLoading(false);
        }
    }

    async function gerarComprovantePDF() {
        if (!protocolo) return;
        setGerandoPDF(true);

        try {
            const qrRes = await api.get(`/protocolos/${id}/qrcode`);
            const qrCodeImagem = qrRes.data.qrcode;

            const doc = new jsPDF();

            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(0, 74, 141);
            doc.text("Universidade Estadual do Maranhão", 105, 20, null, null, "center");
            
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text("Sistema de Protocolo Geral - Comprovante de Tramitação", 105, 28, null, null, "center");
            
            doc.setLineWidth(0.5);
            doc.setDrawColor(200);
            doc.line(20, 35, 190, 35);

            doc.setTextColor(0);
            doc.setFontSize(11);
            
            let y = 50;
            const marginL = 20;
            const valorX = 60;

            const addLinha = (label, valor) => {
                doc.setFont("helvetica", "bold");
                doc.text(label, marginL, y);
                doc.setFont("helvetica", "normal");
                doc.text(String(valor || '-'), valorX, y);
                y += 8;
            };

            addLinha("Protocolo Nº:", protocolo.numero_protocolo);
            addLinha("Data Criação:", new Date(protocolo.criado_em).toLocaleString('pt-BR'));
            addLinha("Tipo:", protocolo.tipo_documento_nome);
            
            doc.setFont("helvetica", "bold");
            doc.text("Assunto:", marginL, y);
            doc.setFont("helvetica", "normal");
            const splitAssunto = doc.splitTextToSize(protocolo.assunto, 100); 
            doc.text(splitAssunto, valorX, y);
            y += (splitAssunto.length * 8);

            addLinha("Remetente:", protocolo.remetente_nome);
            addLinha("Origem:", protocolo.setor_origem_sigla);
            addLinha("Destino Atual:", protocolo.setor_destino_sigla);
            
            y += 2;
            doc.setFont("helvetica", "bold");
            doc.text("Status Atual:", marginL, y);
            doc.setTextColor(0, 74, 141);
            doc.text(protocolo.status.toUpperCase().replace('_', ' '), valorX, y);
            doc.setTextColor(0);

            if (qrCodeImagem) {
                doc.addImage(qrCodeImagem, 'PNG', 140, 45, 50, 50);
            }

            if (y < 105) y = 110; 
            else y += 10;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(0, 74, 141);
            doc.text("Histórico de Tramitações", marginL, y);
            doc.line(marginL, y+1, 190, y+1);
            y += 10;

            doc.setFontSize(10);
            doc.setTextColor(0);

            if (protocolo.tramitacoes && protocolo.tramitacoes.length > 0) {
                protocolo.tramitacoes.forEach((tram) => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    const dataTram = new Date(tram.data_tramitacao).toLocaleString('pt-BR');
                    
                    doc.setFont("helvetica", "bold");
                    doc.text(`${dataTram}`, marginL, y);
                    doc.text(`${tram.setor_origem_sigla}  -->  ${tram.setor_destino_sigla}`, marginL + 45, y);
                    y += 5;
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(80);
                    const textoDetalhe = `Resp: ${tram.usuario_nome} | ${tram.observacao || 'Sem obs.'}`;
                    const textoQuebrado = doc.splitTextToSize(textoDetalhe, 170);
                    doc.text(textoQuebrado, marginL, y);
                    y += (textoQuebrado.length * 5) + 5; 
                    doc.setTextColor(0);
                });
            }

            doc.save(`Protocolo_${protocolo.numero_protocolo}.pdf`);
            toast.success("Comprovante baixado com sucesso!");

        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar PDF");
        } finally {
            setGerandoPDF(false);
        }
    }

    // === NOVA FUNÇÃO: ABRE O MODAL DE ASSINATURA ===
    function confirmarRecebimento() {
        setModalAssinatura(true);
    }

    // === NOVA FUNÇÃO: ENVIA A SENHA PRO BACKEND ===
    async function realizarAssinaturaDigital(e) {
        e.preventDefault();

        try {
            await api.put(`/protocolos/${id}/receber`, { senha: senhaAssinatura });
            toast.success('Recebimento confirmado e assinado digitalmente!');
            setModalAssinatura(false);
            setSenhaAssinatura('');
            carregarDados();
        } catch (error) {
            // O backend retorna 400 se a senha for inválida, então não desloga
            toast.error(error.response?.data?.erro || 'Senha incorreta ou erro na assinatura');
        }
    }

    async function handleTramitar(e) {
        e.preventDefault();
        if (!tramitarForm.setor_destino_id) {
            toast.error('Selecione o setor de destino');
            return;
        }
        try {
            await api.put(`/protocolos/${id}/tramitar`, tramitarForm);
            toast.success('Protocolo tramitado com sucesso!');
            setModalTramitar(false);
            setTramitarForm({ setor_destino_id: '', observacao: '' });
            carregarDados();
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao tramitar');
        }
    }

    async function handleArquivar() {
        if (!confirm('Deseja arquivar este protocolo?')) return;
        try {
            await api.put(`/protocolos/${id}/arquivar`);
            toast.success('Protocolo arquivado!');
            carregarDados();
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao arquivar');
        }
    }

    async function handleDesarquivar() {
        if (!confirm('Deseja desarquivar este protocolo?')) return;
        try {
            await api.put(`/protocolos/${id}/desarquivar`);
            toast.success('Protocolo desarquivado!');
            carregarDados();
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao desarquivar');
        }
    }

    async function handleDeletar() {
        if (!confirm('Deseja realmente excluir este protocolo? Esta ação não pode ser desfeita.')) return;
        try {
            await api.delete(`/protocolos/${id}`);
            toast.success('Protocolo excluído!');
            navigate('/protocolos');
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao excluir');
        }
    }

    async function handleGerarQRCode() {
        try {
            const response = await api.get(`/protocolos/${id}/qrcode`);
            setQrCodeData(response.data);
            setModalQRCode(true);
        } catch (error) {
            toast.error('Erro ao gerar QR Code');
        }
    }

    function handleCopiarNumero() {
        navigator.clipboard.writeText(protocolo.numero_protocolo);
        toast.success('Número copiado!');
    }

    function getArquivoUrl() {
        return `http://localhost:3000/uploads/${protocolo.arquivo_url}`;
    }

    function getArquivoExtensao() {
        if (!protocolo?.arquivo_url) return '';
        return protocolo.arquivo_url.split('.').pop().toLowerCase();
    }

    function isPDF() {
        return getArquivoExtensao() === 'pdf';
    }

    function isImagem() {
        const ext = getArquivoExtensao();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
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

    const isAdmin = usuario?.perfil === 'admin';
    const isOperador = usuario?.perfil === 'operador';
    const isCriador = protocolo?.remetente_id === usuario?.id;
    const isDestinatario = protocolo?.setor_destino_id === usuario?.setor?.id;
    
    // Regra 1: Só pode receber se for o destino e estiver em trânsito
    const podeReceber = isDestinatario && protocolo?.status === 'em_transito';

    // Regra 2: SÓ PODE TRAMITAR SE JÁ FOI RECEBIDO (Status = Recebido)
    // Se for Admin, pode tramitar a qualquer momento, mas para operadores/destino, exige recebimento
    const podeTramitar = (isAdmin || isDestinatario) && protocolo?.status === 'recebido';

    const podeArquivar = (isAdmin || isOperador) && protocolo?.status !== 'arquivado';
    const podeDesarquivar = (isAdmin || isOperador) && protocolo?.status === 'arquivado';
    const podeDeletar = isAdmin || (isCriador && protocolo?.status !== 'recebido');

    if (loading) {
        return <div className="loading">Carregando...</div>;
    }

    if (!protocolo) {
        return <div className="loading">Protocolo não encontrado</div>;
    }

    return (
        <div className="protocolo-detalhes">
            <div className="detalhes-header no-print">
                <button className="btn btn-outline" onClick={() => navigate('/protocolos')}>
                    <FiArrowLeft /> Voltar
                </button>
                <div className="detalhes-acoes">
                    <button 
                        className="btn btn-outline" 
                        onClick={gerarComprovantePDF} 
                        disabled={gerandoPDF}
                    >
                        {gerandoPDF ? 'Gerando...' : <><FiPrinter /> Comprovante</>}
                    </button>

                    <button className="btn btn-outline" onClick={handleCopiarNumero}><FiCopy /></button>
                    <button className="btn btn-outline" onClick={handleGerarQRCode}><BsQrCode /> QR Code</button>

                    {/* Botão de Receber abre o Modal de Assinatura */}
                    {podeReceber && (
                        <button className="btn btn-success" onClick={confirmarRecebimento}>
                            <FiCheck /> Receber
                        </button>
                    )}

                    {/* Botão de Tramitar só aparece se o status for RECEBIDO */}
                    {podeTramitar && (
                        <button className="btn btn-primary" onClick={() => setModalTramitar(true)}>
                            <FiSend /> Tramitar
                        </button>
                    )}

                    {podeArquivar && (
                        <button className="btn btn-secondary" onClick={handleArquivar}>
                            <FiArchive /> Arquivar
                        </button>
                    )}
                    {podeDesarquivar && (
                        <button className="btn btn-warning" onClick={handleDesarquivar}>
                            <FiRefreshCw /> Desarquivar
                        </button>
                    )}
                    {podeDeletar && (
                        <button className="btn btn-danger" onClick={handleDeletar}>
                            <FiTrash2 />
                        </button>
                    )}
                </div>
            </div>

            <div className="detalhes-grid">
                <div className="card detalhes-info">
                    <div className="protocolo-numero">
                        <span className="label">Protocolo</span>
                        <span className="valor">{protocolo.numero_protocolo}</span>
                        <span className={`badge badge-lg badge-${protocolo.status}`}>
                            {getStatusLabel(protocolo.status)}
                        </span>
                    </div>
                    
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="label">Tipo de Documento</span>
                            <span className="valor">{protocolo.tipo_documento_nome}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Data de Criação</span>
                            <span className="valor">{formatarDataHora(protocolo.criado_em)}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Remetente</span>
                            <span className="valor">{protocolo.remetente_nome}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Email</span>
                            <span className="valor">{protocolo.remetente_email}</span>
                        </div>
                    </div>

                    <div className="tramite-info">
                        <div className="tramite-box origem">
                            <span className="tramite-label">Origem</span>
                            <span className="tramite-sigla">{protocolo.setor_origem_sigla}</span>
                            <span className="tramite-nome">{protocolo.setor_origem_nome}</span>
                        </div>
                        <div className="tramite-seta">→</div>
                        <div className="tramite-box destino">
                            <span className="tramite-label">Destino Atual</span>
                            <span className="tramite-sigla">{protocolo.setor_destino_sigla}</span>
                            <span className="tramite-nome">{protocolo.setor_destino_nome}</span>
                        </div>
                    </div>

                    <div className="info-full">
                        <span className="label">Assunto</span>
                        <p className="valor assunto">{protocolo.assunto}</p>
                    </div>

                    {protocolo.descricao && (
                        <div className="info-full">
                            <span className="label">Descrição</span>
                            <p className="valor descricao">{protocolo.descricao}</p>
                        </div>
                    )}

                    {protocolo.arquivo_url && (
                        <div className="info-full arquivo-section">
                            <span className="label">Arquivo Anexado</span>
                            <div className="arquivo-acoes">
                                {(isPDF() || isImagem()) && (
                                    <button 
                                        className="btn btn-outline"
                                        onClick={() => setModalVisualizar(true)}
                                    >
                                        <FiEye /> Visualizar
                                    </button>
                                )}
                                <a 
                                    href={getArquivoUrl()}
                                    download
                                    className="btn btn-outline"
                                >
                                    <FiDownload /> Baixar
                                </a>
                            </div>
                        </div>
                    )}

                    {protocolo.recebido_em && (
                        <div className="info-recebido">
                            <FiCheck className="icon-recebido" />
                            <span>
                                Recebido por <strong>{protocolo.recebido_por_nome}</strong> em {formatarDataHora(protocolo.recebido_em)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="card detalhes-historico">
                    <h3>Histórico de Tramitações</h3>
                    
                    {protocolo.tramitacoes?.length === 0 ? (
                        <p className="empty-message">Nenhuma tramitação registrada</p>
                    ) : (
                        <div className="timeline">
                            {protocolo.tramitacoes?.map((tram, index) => (
                                <div key={tram.id} className={`timeline-item ${index === 0 ? 'atual' : ''}`}>
                                    <div className="timeline-marker"></div>
                                    <div className="timeline-content">
                                        <div className="timeline-header">
                                            <span className="setor-badge">{tram.setor_origem_sigla}</span>
                                            <span className="timeline-arrow">→</span>
                                            <span className="setor-badge destino">{tram.setor_destino_sigla}</span>
                                        </div>
                                        <p className="timeline-usuario">Por: {tram.usuario_nome}</p>
                                        {tram.observacao && (
                                            <p className="timeline-obs">"{tram.observacao}"</p>
                                        )}
                                        <span className="timeline-data">{formatarDataHora(tram.data_tramitacao)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Tramitar */}
            {modalTramitar && (
                <div className="modal-overlay" onClick={() => setModalTramitar(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Tramitar Protocolo</h2>
                            <button className="modal-close" onClick={() => setModalTramitar(false)}>
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleTramitar}>
                            <div className="form-group">
                                <label>Setor de Destino *</label>
                                <select
                                    value={tramitarForm.setor_destino_id}
                                    onChange={(e) => setTramitarForm({ ...tramitarForm, setor_destino_id: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {setores.map(setor => (
                                        <option key={setor.id} value={setor.id}>
                                            {setor.sigla} - {setor.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Observação / Despacho</label>
                                <textarea
                                    value={tramitarForm.observacao}
                                    onChange={(e) => setTramitarForm({ ...tramitarForm, observacao: e.target.value })}
                                    placeholder="Observação sobre a tramitação (opcional)"
                                    rows={3}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setModalTramitar(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <FiSend /> Tramitar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal QR Code */}
            {modalQRCode && qrCodeData && (
                <div className="modal-overlay" onClick={() => setModalQRCode(false)}>
                    <div className="modal modal-qrcode" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>QR Code do Protocolo</h2>
                            <button className="modal-close" onClick={() => setModalQRCode(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="qrcode-content">
                            <img src={qrCodeData.qrcode} alt="QR Code" className="qrcode-image" />
                            <div className="qrcode-info">
                                <p className="qrcode-instrucao">
                                    Escaneie o QR Code para ver as informações e o histórico.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Visualizar Documento */}
            {modalVisualizar && protocolo.arquivo_url && (
                <div className="modal-overlay" onClick={() => setModalVisualizar(false)}>
                    <div className="modal modal-documento" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Visualizar Documento</h2>
                            <button className="modal-close" onClick={() => setModalVisualizar(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="documento-viewer">
                            {isPDF() ? (
                                <iframe
                                    src={getArquivoUrl()}
                                    title="Documento PDF"
                                    className="pdf-viewer"
                                />
                            ) : isImagem() ? (
                                <img 
                                    src={getArquivoUrl()} 
                                    alt="Documento" 
                                    className="imagem-viewer"
                                />
                            ) : (
                                <p>Não é possível visualizar este tipo de arquivo.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* === MODAL DE ASSINATURA DIGITAL === */}
            {modalAssinatura && (
                <div className="modal-overlay">
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Assinatura Digital</h2>
                            <button className="modal-close" onClick={() => setModalAssinatura(false)}>
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={realizarAssinaturaDigital}>
                            <div className="modal-body" style={{padding: '20px'}}>
                                <p style={{marginBottom: '15px', color: '#555', fontSize: '0.95rem'}}>
                                    Para confirmar o recebimento e assumir a responsabilidade por este protocolo, digite sua senha pessoal para assinar digitalmente o registro.
                                </p>

                                <div className="form-group">
                                    <label>Sua Senha de Login</label>
                                    <input 
                                        type="password" 
                                        value={senhaAssinatura}
                                        onChange={(e) => setSenhaAssinatura(e.target.value)}
                                        placeholder="Digite sua senha para assinar"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalAssinatura(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-success">
                                    <FiCheck /> Assinar e Receber
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProtocoloDetalhes;