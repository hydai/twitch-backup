import React from 'react';
import { useStore } from '../store';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { activeTab, setActiveTab } = useStore();

  const tabs = [
    { id: 'search', label: 'Search & Backup' },
    { id: 'downloads', label: 'Backups' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'settings', label: 'Settings' }
  ] as const;

  return (
    <div className="main-layout">
      <header className="header">
        <h1>Twitch Backup</h1>
        <nav className="tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="content">
        {children}
      </main>
    </div>
  );
}