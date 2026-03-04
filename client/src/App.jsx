import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AppLayout from './components/AppLayout';
import AuthPage from './pages/AuthPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import { initializeTelegramApp, tg } from './lib/telegram';
import { loginWithTelegram } from './lib/api';

function ProtectedRoute({ children, isAuthenticated }) {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const [tgUser, setTgUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isWebApp, setIsWebApp] = useState(false);

  useEffect(() => {
    // 1. TWA initializatsiyasi
    const user = initializeTelegramApp();
    if (user) {
      setTgUser(user);
      setIsWebApp(true);
      // Agar TWA bo'lsa, avtomatik login qildirish
      loginWithTelegram()
        .then(() => setIsAuthenticated(true))
        .catch(err => console.error("TWA Login xatosi:", err));
    }

    // 2. Token o'zgarganini kuzatish (Login page dan keyin)
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };

    window.addEventListener('storage', checkAuth);
    // Interval orqali tekshirish (chunki login page localstorage yozadi)
    const interval = setInterval(checkAuth, 1000);
    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AppLayout tgUser={tgUser} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard tgUser={tgUser} />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
