import React from 'react';
import { MainLayout } from './components/MainLayout';
import { StreamerSearch } from './components/StreamerSearch';
import { VODList } from './components/VODList';
import { DownloadQueue } from './components/DownloadQueue';
import { ScheduledTasks } from './components/ScheduledTasks';
import { Settings } from './components/Settings';
import { useStore } from './store';

export function App() {
  const activeTab = useStore((state) => state.activeTab);

  return (
    <MainLayout>
      {activeTab === 'search' && (
        <>
          <StreamerSearch />
          <VODList />
        </>
      )}
      {activeTab === 'downloads' && <DownloadQueue />}
      {activeTab === 'scheduled' && <ScheduledTasks />}
      {activeTab === 'settings' && <Settings />}
    </MainLayout>
  );
}