import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { AgentLibrary } from './components/AgentLibrary';
import { MarketStats } from './components/MarketStats';
import { NovaFunding } from './components/NovaFunding';
import { Meetings } from './components/Meetings';
import { AuthPage } from './components/AuthPage';
import { Settings } from './components/Settings';
import { Library } from './components/Library';
import { Plugins } from './components/Plugins';
import { initAuth } from './lib/firebase';
import { User } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState('agent');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeAgent, setActiveAgent] = useState('general');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u) => {
        setUser(u);
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAFAFA]">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={() => setIsAuthLoading(false)} />;
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-stone-900 font-sans overflow-hidden selection:bg-stone-200">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
      />
      
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {activeTab === 'new-task' ? (
          <ChatInterface 
            activeAgent={activeAgent} 
            setActiveAgent={setActiveAgent} 
            currentSessionId={currentSessionId}
            setCurrentSessionId={setCurrentSessionId}
          />
        ) : activeTab === 'settings' ? (
          <Settings />
        ) : activeTab === 'agent' ? (
          <AgentLibrary setActiveTab={setActiveTab} setActiveAgent={setActiveAgent} activeAgent={activeAgent} />
        ) : activeTab === 'market-stats' ? (
          <MarketStats />
        ) : activeTab === 'funding' ? (
          <NovaFunding />
        ) : activeTab === 'meetings' ? (
          <Meetings />
        ) : activeTab === 'library' ? (
          <Library />
        ) : activeTab === 'plugins' ? (
          <Plugins />
        ) : (
          <div className="flex-1 flex items-center justify-center text-stone-500 flex-col gap-4">
            <div className="w-16 h-16 rounded-2xl border border-stone-200 bg-white flex items-center justify-center shadow-sm">
              🚧
            </div>
            <p className="text-sm">Module under construction.</p>
            <button 
              onClick={() => setActiveTab('new-task')}
              className="text-stone-800 hover:text-stone-900 transition-colors text-sm font-medium hover:underline"
            >
              Return to Workspace
            </button>
          </div>
        )}
      </main>
    </div>
  );
}


