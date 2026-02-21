
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { Form, User } from './types';
import { storageService } from './services/storageService';
import Dashboard from './components/Dashboard';
import FormBuilder from './components/FormBuilder';
import FormRenderer from './components/FormRenderer';
import Analytics from './components/Analytics';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  // Simple mock login for demonstration
  const handleLogin = () => {
    setUser({ id: 'user_1', name: 'Demo User', email: 'demo@example.com' });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center space-x-2">
                <Link to="/" className="flex items-center space-x-2 text-indigo-600">
                  <i className="fa-solid fa-square-poll-vertical text-2xl"></i>
                  <span className="text-xl font-bold tracking-tight text-slate-800">Experience Evaluator</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                {user ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-slate-600 hidden md:inline">Welcome, {user.name}</span>
                    <button 
                      onClick={handleLogout}
                      className="text-sm px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleLogin}
                    className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Login to Create
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/create" element={<FormBuilder user={user} />} />
            <Route path="/edit/:id" element={<FormBuilder user={user} />} />
            <Route path="/form/:id" element={<FormRenderer />} />
            <Route path="/analytics/:id" element={<Analytics user={user} />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-slate-200 py-6">
          <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Experience Evaluator. Built for seamless feedback.
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
