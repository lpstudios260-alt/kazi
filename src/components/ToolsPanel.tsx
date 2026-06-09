import React from 'react';
import { 
  FileText, 
  Globe, 
  ShieldCheck, 
  TrendingUp,
  Plus,
  MoreVertical
} from 'lucide-react';
import { Task } from '../types';

export function ToolsPanel() {
  const activeTasks: Task[] = [
    { id: '1', title: 'Draft Delaware C-Corp vs OHADA memo', status: 'in_progress', category: 'legal' },
    { id: '2', title: 'Review Paystack integration flow', status: 'completed', category: 'product' },
    { id: '3', title: 'Compile top 10 AgriTech grants', status: 'pending', category: 'funding' },
  ];

  const renderTaskIcon = (category: string) => {
    switch (category) {
      case 'legal': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'funding': return <TrendingUp className="w-4 h-4 text-orange-400" />;
      case 'market': return <Globe className="w-4 h-4 text-indigo-400" />;
      case 'product': return <FileText className="w-4 h-4 text-blue-400" />;
      default: return <FileText className="w-4 h-4 text-white/40" />;
    }
  };

  return (
    <div className="w-[340px] bg-[#0E0E10] border-l border-white/[0.06] flex flex-col h-screen overflow-y-auto relative z-20">
      <div className="h-16 px-6 border-b border-white/[0.04] flex items-center shrink-0">
        <div>
          <h2 className="text-xs font-semibold tracking-wide text-zinc-200">Active Workspace</h2>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Ongoing Operations</p>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        
        {/* Financial Intel */}
        <div className="p-5 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
          <div className="flex justify-between items-start mb-5">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Capital Intel</h2>
            <span className="text-[9px] px-2 py-0.5 bg-white/[0.04] rounded-md text-zinc-400">USD/NGN</span>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-light tracking-tight text-white">$42,105.80</p>
              <p className="text-[10px] text-emerald-400 mt-1">+12.4% Efficient growth vs last month</p>
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">M-Pesa Pool</span>
                <span className="font-mono text-zinc-300">KSh 1.2M</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Flutterwave</span>
                <span className="font-mono text-zinc-300">₦ 18.4M</span>
              </div>
              <div className="flex justify-between text-xs border-t border-white/[0.04] pt-2 mt-1">
                <span className="text-zinc-400 font-medium tracking-wide">Series A Readiness</span>
                <span className="font-mono text-zinc-200">82%</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Tasks & Compliance</h3>
            <button className="text-zinc-500 hover:text-zinc-300 transition-colors bg-white/[0.04] hover:bg-white/[0.08] p-1 rounded-md">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {activeTasks.map(task => (
              <div key={task.id} className="p-3.5 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:bg-white/[0.04] transition-colors group cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {renderTaskIcon(task.category)}
                    </div>
                    <div>
                      <p className="text-[12px] text-zinc-200 font-medium leading-snug">{task.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${
                          task.status === 'completed' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' :
                          task.status === 'in_progress' ? 'border-indigo-500/20 text-indigo-400 bg-indigo-500/10' :
                          'border-white/[0.08] text-zinc-500 bg-white/[0.02]'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
