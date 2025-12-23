# Sistema de Protocolo Geral - UEMA (SIPRO)

Este repositório contém o código-fonte do **SIPRO** (Sistema de Protocolo), uma aplicação web desenvolvida / Projeto Final para a disciplina de Análise e Desenvolvimento de Sistemas da Universidade Estadual do Maranhão (UEMA).

O objetivo do sistema é modernizar e digitalizar o trâmite de processos administrativos, substituindo o uso de papel por um fluxo digital seguro, auditável e eficiente.

## Funcionalidades Principais

* **Autenticação e Segurança:** Login seguro e Recuperação de Senha automática via E-mail.
* **Gestão de Protocolos:** Criação de processos com upload de anexos (PDF/Imagens).
* **Tramitação Digital:** Envio de processos entre setores (Origem -> Destino).
* **Assinatura Digital Simplificada:** Mecanismo que exige a senha do usuário para confirmar o recebimento de um protocolo (Não-Repúdio).
* **Bloqueio de Fluxo:** Regra de negócio que impede a tramitação de documentos que não foram formalmente recebidos.
* **Dashboard Gerencial:** Painel com gráficos e indicadores de desempenho (BI).
* **Rastreabilidade:** Geração de Comprovantes em PDF com QR Code dinâmico para consulta pública.

## Tecnologias Utilizadas

* **Frontend:** React.js, Vite, React Router, Axios.
* **Backend:** Node.js, Express.
* **Banco de Dados:** SQLite (Arquivo local `database.sqlite`).
* **Serviços:** Nodemailer (Envio de E-mails), Bcryptjs (Criptografia), JsPDF (Relatórios), Google Gemini API (Inteligência Artificial).

## Instalação e Configuração

Siga os passos abaixo para rodar o projeto em sua máquina local.

### 1. Clonar o Repositório

bash
git clone [https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git](https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git)
cd sistema-protocolo-geral-uema
2. Instalar Dependências
Backend (Servidor):

Bash

cd backend
npm install
Frontend (Interface):

Bash

cd ../frontend
npm install
3. Configuração de Credenciais (Obrigatório)
Por questões de segurança, as senhas e chaves de API foram removidas deste código público. Para que o sistema funcione corretamente (especialmente o login e envio de e-mails), você deve abrir os arquivos abaixo e inserir suas próprias credenciais:

A) Configurar E-mail (Para Recuperação de Senha)

Abra o arquivo: backend/src/services/emailService.js

Procure por user e pass.

Ação: Substitua 'SEU_EMAIL_AQUI' e 'SUA_SENHA_AQUI' por um e-mail válido (Ex: Gmail com Senha de Aplicativo).

B) Configurar Segurança (JWT)

Abra o arquivo: backend/src/config/auth.js (ou onde estiver sua configuração JWT).

Ação: Substitua 'SEU_SEGREDO_JWT' por uma senha aleatória qualquer.

C) Configurar Inteligência Artificial (Opcional)

Se for utilizar a busca por IA, insira sua chave da API Google Gemini no arquivo de configuração correspondente em backend/src/config/.

4. Executar o Projeto
Você precisará de dois terminais abertos:

Terminal 1 (Backend):

Bash

cd backend
npm start
# O servidor iniciará na porta 3000
Terminal 2 (Frontend):

Bash

cd frontend
npm run dev
# O frontend iniciará (geralmente na porta 5173)
Acesse o sistema no navegador através do link exibido no terminal do Frontend.

Documentação do Projeto
O desenvolvimento deste software seguiu as etapas da Engenharia de Software, incluindo:

Levantamento de Requisitos: Definição de regras de negócio e perfis de usuário.

Modelagem UML: Diagramas de Casos de Uso, Classes e Sequência.

Testes de Software: Validação de fluxos e segurança (Caixa Preta).

Desenvolvido por: José Ribamar Cerqueira Muniz
