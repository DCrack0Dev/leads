import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, MessageCircle, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import WhatsApp from './pages/WhatsApp';
import Settings from './pages/Settings';

function App() {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'WhatsApp', path: '/whatsapp', icon: MessageCircle },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">
          <div className="p-8 border-b border-gray-100">
            <h1 className="text-2xl font-black text-indigo-600 tracking-tighter">Demitech</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Lead Bot Pro</p>
          </div>
          
          <nav className="flex-1 p-6 space-y-2">
            {navItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition
                  ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-6 border-t border-gray-100">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center font-bold text-indigo-600">T</div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-none">Tebogo</p>
                <p className="text-xs font-medium text-gray-500 mt-1">Admin Account</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
