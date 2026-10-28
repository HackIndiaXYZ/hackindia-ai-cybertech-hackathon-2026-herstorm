import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import './SidebarLayout.css';

export default function SidebarLayout({ title, navItems = [], activeNav, onNavChange, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="app-layout">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Sprout size={22} strokeWidth={1.75} />
          <span>TraceCrop</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onNavChange(item.id);
                  setMobileOpen(false);
                }}
              >
                {Icon && <Icon size={18} strokeWidth={1.75} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div>Role: <strong>{user?.role?.toUpperCase()}</strong></div>
          <div style={{ marginTop: 2 }}>{user?.address || 'Maharashtra Hub'}</div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              className="topbar-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
            </button>
            <h1 className="topbar-title">{title}</h1>
          </div>

          <div className="topbar-right">
            <div className="user-profile-badge">
              <div className="user-avatar">{getInitials(user?.name)}</div>
              <div className="user-meta">
                <span className="user-meta-name">{user?.name}</span>
                <span className="user-meta-role">{user?.phone}</span>
              </div>
            </div>

            <button className="btn-logout" onClick={handleLogout} aria-label="Sign out">
              <LogOut size={16} strokeWidth={1.75} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
