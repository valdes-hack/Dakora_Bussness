import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <Router>
              <AppRoutes />
            </Router>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;