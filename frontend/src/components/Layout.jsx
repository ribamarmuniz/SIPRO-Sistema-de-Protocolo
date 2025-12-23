import Header from './Header';
import Footer from './Footer';
import './Layout.css';

function Layout({ children }) {
    return (
        <div className="layout">
            <Header />
            <main className="main-content">
                <div className="container">
                    {children}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default Layout;