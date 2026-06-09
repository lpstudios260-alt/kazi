import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  CheckSquare, 
  BarChart2, 
  Settings, 
  Compass,
  FolderOpen,
  History,
  Library,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Monitor,
  LogOut,
  Target,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
}


const navItems = [
  { id: 'new-task', icon: MessageSquare, label: 'New task' },
  { id: 'agent', icon: Compass, label: 'Agents' },
  { id: 'funding', icon: Target, label: 'Funding' },
  { id: 'market-stats', icon: BarChart2, label: 'Market Intelligence' },
  { id: 'meetings', icon: History, label: 'Meetings' },
  { id: 'library', icon: Library, label: 'Library' },
  { id: 'scheduled', icon: History, label: 'Scheduled' },
  { id: 'plugins', icon: CheckSquare, label: 'Plugins' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, currentSessionId, setCurrentSessionId }: SidebarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) {
        import('../lib/sessions').then(({ getSessions }) => {
          getSessions().then(setSessions).catch(console.error);
        });
      }
    });
    return unsub;
  }, []);
  
  // Refresh sessions when active tab is changed assuming a chat was running
  useEffect(() => {
    if (user) {
      import('../lib/sessions').then(({ getSessions }) => {
        getSessions().then(setSessions).catch(console.error);
      });
    }
  }, [currentSessionId, user]);

  const handleLogout = () => {
    signOut(auth);
  };

  const username = user?.email ? user.email.split('@')[0] : 'User';
  const initial = username.charAt(0).toUpperCase();

  return (
    <motion.div 
      initial={false}
      animate={{ 
        width: isOpen ? 260 : 72,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-[#19191A] border-r border-stone-800/50 flex flex-col h-screen py-4 relative z-20 overflow-hidden flex-shrink-0"
    >
      <div className={`flex items-center ${isOpen ? 'justify-between px-5' : 'justify-center'} mb-6 h-8`}>
        {isOpen && (
          <div className="flex items-center gap-2 text-white cursor-pointer overflow-hidden whitespace-nowrap">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="font-semibold text-lg tracking-tight font-serif" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>manus</span>
          </div>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {isOpen && (
            <button className="p-1.5 text-stone-400 hover:text-stone-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          )}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-stone-400 hover:text-stone-300 transition-colors shrink-0"
          >
            {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      <nav className={`flex flex-col space-y-1 ${isOpen ? 'px-3' : 'px-3 items-center'} flex-1`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && (item.id !== 'new-task' || currentSessionId === null);
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === 'new-task') {
                  setCurrentSessionId(null);
                }
              }}
              className={`flex items-center ${isOpen ? 'justify-start px-3 py-2' : 'justify-center w-10 h-10'} rounded-lg transition-all relative group ${
                isActive ? 'text-white bg-white/10' : 'text-stone-400 hover:bg-white/5 hover:text-stone-300'
              }`}
            >
              <Icon className={`${isOpen ? 'w-4 h-4 mr-3 shrink-0' : 'w-5 h-5 shrink-0'}`} />
              <AnimatePresence>
                {isOpen && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}

        <div className={`mt-6 ${isOpen ? '' : 'hidden'}`}>
          <div className="flex items-center justify-between text-stone-500 text-[11px] uppercase font-semibold px-3 mb-2">
            Projects
            <button className="hover:text-stone-300"><Plus className="w-3.5 h-3.5" /></button>
          </div>
          <button className="flex items-center justify-start w-full px-3 py-2 rounded-lg text-stone-400 hover:bg-white/5 hover:text-stone-300 transition-all text-sm group">
            <FolderOpen className="w-4 h-4 mr-3 shrink-0" />
            <span className="text-[13px] font-medium whitespace-nowrap">New project</span>
          </button>
        </div>
        
        <div className={`mt-4 ${isOpen ? '' : 'hidden'} flex-1 overflow-y-auto`}>
          <div className="flex items-center justify-between text-stone-500 text-[11px] uppercase font-semibold px-3 mb-2">
            Recent Chats
            <button 
              className="hover:text-stone-300"
              onClick={() => {
                setCurrentSessionId(null);
                setActiveTab('new-task');
              }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
           
           {sessions.length === 0 ? (
             <div className="mt-8 flex flex-col items-center justify-center text-center opacity-50 px-4">
               <div className="w-10 h-10 border border-dashed border-stone-600 rounded-lg flex items-center justify-center mb-3">
                 <MessageSquare className="w-5 h-5 text-stone-400" />
               </div>
               <p className="text-[11px] text-stone-400">Create a new task to get started</p>
             </div>
           ) : (
             <div className="space-y-0.5">
               {sessions.map(session => (
                 <button
                   key={session.id}
                   onClick={() => {
                     setCurrentSessionId(session.id);
                     setActiveTab('new-task');
                   }}
                   className={`flex items-center justify-start w-full px-3 py-2 rounded-lg transition-all text-sm group ${currentSessionId === session.id && activeTab === 'new-task' ? 'bg-white/10 text-white' : 'text-stone-400 hover:bg-white/5 hover:text-stone-300'}`}
                 >
                   <MessageSquare className="w-4 h-4 mr-3 shrink-0" />
                   <span className="text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis text-left flex-1" title={session.title}>{session.title}</span>
                 </button>
               ))}
             </div>
           )}
        </div>
      </nav>

      <div className={`mt-auto flex ${isOpen ? 'flex-row items-center justify-between px-5 py-2' : 'flex-col items-center space-y-4 py-2'}`}>
        <div className="flex items-center gap-3 w-full overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {initial}
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.span 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-stone-300 text-[13px] font-medium whitespace-nowrap overflow-hidden flex-1 text-ellipsis"
              >
                {username}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className={`flex items-center ${isOpen ? 'gap-3 shrink-0' : 'flex-col gap-4'}`}>
          <button 
            onClick={handleLogout}
            title="Sign out"
            className="text-stone-400 hover:text-stone-300"
          >
             <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

