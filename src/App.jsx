import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import { DataCacheProvider } from './context/DataCacheContext';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SettingsProvider>
          <DataCacheProvider>
            <CartProvider>
              <Router>
                <AppRoutes />
              </Router>
            </CartProvider>
          </DataCacheProvider>
        </SettingsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;