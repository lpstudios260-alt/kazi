import React from 'react';
import { AGENTS } from '../agents';
import { Sparkles, Bot, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AgentLibraryProps {
  setActiveTab: (tab: string) => void;
  setActiveAgent: (id: string) => void;
  activeAgent: string;
}

export function AgentLibrary({ setActiveTab, setActiveAgent, activeAgent }: AgentLibraryProps) {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#FAFAFA] text-stone-900 selection:bg-stone-200 hide-scrollbar pb-12">
      <div className="max-w-5xl mx-auto w-full px-8 pt-16 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-stone-200/60 p-1.5 rounded-lg text-stone-600 block w-fit">
              <Bot className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-stone-500 uppercase tracking-widest">Agents</span>
          </div>
          <h1 className="text-4xl text-stone-900 font-serif tracking-tight mb-4" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>
            Domain-Specific Intelligence
          </h1>
          <p className="text-[15px] text-stone-600 max-w-2xl leading-relaxed">
            Activate specialized agents to help you contextualize decisions for your startup. 
            Each agent brings focused expertise for the unique regulatory, product, and fundraising landscape.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {AGENTS.map((agent, i) => (
            <motion.div 
              key={agent.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-stone-200 rounded-2xl p-5 hover:shadow-md hover:border-stone-300 transition-all flex flex-col h-full relative overflow-hidden group cursor-pointer"
              onClick={() => {
                setActiveAgent(agent.id);
                setActiveTab('new-task');
              }}
            >
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeAgent === agent.id ? 'bg-stone-800 text-white shadow-md' : 'bg-stone-100 text-stone-600'} transition-colors`}>
                  <agent.icon className="w-5 h-5" />
                </div>
                {activeAgent === agent.id ? (
                  <div className="flex items-center gap-1.5 bg-green-50 text-green-700 font-medium text-[11px] px-2 py-1 rounded-full border border-green-200/50">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </div>
                ) : (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-stone-100 text-stone-600 w-8 h-8 rounded-full flex items-center justify-center">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 relative z-10">
                <h3 className="text-[17px] font-semibold text-stone-800 mb-2">{agent.name}</h3>
                <p className="text-[13px] text-stone-500 leading-relaxed font-medium">
                  {agent.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between relative z-10">
                <span className="text-[12px] font-semibold text-stone-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Initialize context
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
