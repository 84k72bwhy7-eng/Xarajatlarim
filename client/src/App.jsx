import React, { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import { initializeTelegramApp, tg } from './lib/telegram';

function App() {
  const [tgUser, setTgUser] = useState(null);

  useEffect(() => {
    const user = initializeTelegramApp();
    if (user) {
      setTgUser(user);
    }
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--tg-theme-bg-color, #f8fafc)' }}>
      <nav className="border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10"
        style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)', borderColor: 'var(--tg-theme-hint-color, #e2e8f0)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            PF
          </div>
          <span className="text-lg font-bold" style={{ color: 'var(--tg-theme-text-color, #0f172a)' }}>
            Xarajatlarim
          </span>
        </div>
        <div className="flex items-center gap-3">
          {tgUser && (
            <span className="text-sm font-medium" style={{ color: 'var(--tg-theme-hint-color, #64748b)' }}>
              {tgUser.first_name}
            </span>
          )}
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-medium overflow-hidden border border-slate-200">
            {tgUser?.photo_url ? (
              <img src={tgUser.photo_url} alt={tgUser.first_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-500 text-sm">{tgUser?.first_name?.charAt(0) || 'U'}</span>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-md mx-auto py-6 px-4">
        <Dashboard tgUser={tgUser} />
      </main>
    </div>
  );
}

export default App;

