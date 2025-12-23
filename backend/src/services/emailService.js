const nodemailer = require('nodemailer');
const db = require('../config/database');
const path = require('path');

// Configuração do Transporter (GMAIL)
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        // ▼▼▼ COLOQUE SUAS CREDENCIAIS AQUI ▼▼▼
        user: 'seu email', 
        pass: 'sua senha de app'     
    }
});

const emailService = {
    // Método original para enviar notificações de setor
    async enviarParaSetor(setorId, assunto, mensagem, numeroProtocolo) {
        try {
            // 1. Buscar emails dos usuários ativos do setor
            const usuarios = db.prepare('SELECT email, nome FROM usuarios WHERE setor_id = ? AND ativo = 1').all(setorId);

            if (!usuarios || usuarios.length === 0) {
                console.log(`Nenhum usuário encontrado no setor ${setorId} para envio de email.`);
                return;
            }

            // 2. Montar lista de destinatários
            const listaEmails = usuarios.map(u => u.email).join(', ');

            console.log(`Enviando email sobre protocolo ${numeroProtocolo} para: ${listaEmails}`);

            // 3. Definir caminho da logo
            const logoPath = path.join(__dirname, '..', 'img', 'logo-uema.png');

            // 4. Enviar o email com a Logo Embutida
            await transporter.sendMail({
                from: '"Sistema de Protocolo UEMA" <nao-responda@uema.br>',
                to: listaEmails,
                subject: `[UEMA] Protocolo ${numeroProtocolo}: ${assunto}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                            .header { background-color: #ffffffff; padding: 30px 20px; text-align: center; }
                            .header img { max-width: 180px; height: auto; }
                            .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
                            .card { background-color: #f8f9fa; border-left: 5px solid #004a8d; padding: 20px; margin: 20px 0; border-radius: 4px; }
                            .btn { display: inline-block; padding: 12px 24px; background-color: #004a8d; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
                            .footer { background-color: #333333; color: #cccccc; padding: 20px; text-align: center; font-size: 12px; line-height: 1.5; }
                            .footer strong { color: #ffffff; }
                            .footer-logo-email { max-width: 100px; margin-bottom: 10px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <img src="cid:logo_uema" alt="UEMA">
                            </div>

                            <div class="content">
                                <h2 style="color: #004a8d; margin-top: 0;">Nova Movimentação no Protocolo</h2>
                                <p>Olá, servidor(a).</p>
                                <p>Há uma nova atualização no sistema de protocolo que requer a atenção do seu setor.</p>
                                
                                <div class="card">
                                    <p style="margin: 5px 0;"><strong>Número:</strong> ${numeroProtocolo}</p>
                                    <p style="margin: 5px 0;"><strong>Assunto:</strong> ${assunto}</p>
                                    <hr style="border: 0; border-top: 1px solid #ddd; margin: 10px 0;">
                                    <p style="margin: 5px 0;"><strong>Mensagem:</strong></p>
                                    <p style="margin: 5px 0; color: #555;">${mensagem}</p>
                                </div>

                                <p>Acesse o sistema para visualizar os detalhes completos, baixar anexos e realizar os despachos necessários.</p>

                                <div style="text-align: center;">
                                    <a href="http://localhost:5173/protocolos" class="btn">Acessar Sistema de Protocolo</a>
                                </div>
                            </div>

                            <div class="footer">
                                <img class="footer-logo-email" src="cid:logo_uema" alt="UEMA">
                                <p><strong>Universidade Estadual do Maranhão - UEMA</strong><br>
                                Cidade Universitária Paulo VI, Avenida Lourenço Vieira da Silva, n.º 1000<br>
                                Jardim São Cristóvão, CEP 65055-310, São Luís/MA</p>
                                <p style="margin-top: 15px; border-top: 1px solid #555; padding-top: 10px;">
                                    Este é um e-mail automático do Sistema do Protocolo Geral da UEMA.<br>
                                    Por favor, não responda a esta mensagem.
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
                attachments: [
                    {
                        filename: 'logo-uema.png',
                        path: logoPath,
                        cid: 'logo_uema'
                    }
                ]
            });

        } catch (error) {
            console.error('Erro ao enviar email:', error);
        }
    },

    // NOVO: Método para enviar email genérico (Recuperação de Senha)
    async enviarEmail(destinatario, assunto, texto) {
        try {
            const logoPath = path.join(__dirname, '..', 'img', 'logo-uema.png');

            await transporter.sendMail({
                from: '"Sistema de Protocolo UEMA" <nao-responda@uema.br>',
                to: destinatario,
                subject: assunto,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                        <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <img src="cid:logo_uema" alt="UEMA" style="max-width: 150px;">
                            </div>
                            <h2 style="color: #004a8d; text-align: center;">Recuperação de Senha</h2>
                            <p style="font-size: 16px; line-height: 1.5;">${texto.replace(/\n/g, '<br>')}</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 12px; color: #888; text-align: center;">Não responda a este e-mail.</p>
                        </div>
                    </body>
                    </html>
                `,
                attachments: [
                    {
                        filename: 'logo-uema.png',
                        path: logoPath,
                        cid: 'logo_uema'
                    }
                ]
            });
            console.log(`Email de recuperação enviado para ${destinatario}`);
        } catch (error) {
            console.error('Erro ao enviar email de recuperação:', error);
        }
    }
};

module.exports = emailService;