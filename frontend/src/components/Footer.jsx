import './Footer.css';

function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-container">
                {/* Parte Esquerda - Logo */}
                <div className="footer-left">
                    <img src="/uema-rodape.png" alt="UEMA" className="footer-logo" />
                </div>
                
                {/* Parte Central - Texto em 6 linhas */}
                <div className="footer-center">
                    <p>Todos os direitos reservados Universidade Estadual do Maranhão - UEMA.</p>
                    <p>Cidade Universitária Paulo VI – Avenida Lourenço Vieira da Silva 1.000 – São Luís/MA.</p>
                    <p>Fone: (98) 2016-8100.</p>
                    <p>Pró-Reitoria de Infraestrutura - PROINFRA</p>
                    <p>Coordenação de Tecnologia da Informação e Comunicação - CTIC</p>
                    <p>Assessoria de Comunicação Institucional</p>
                </div>
                
                {/* Parte Direita - Vazia */}
                <div className="footer-right"></div>
            </div>
        </footer>
    );
}

export default Footer;