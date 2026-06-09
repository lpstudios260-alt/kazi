import React from 'react';
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Opportunity {
  id: string;
  title: string;
  deadline: string;
  type: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  opportunities: Opportunity[];
}

export function FundingCalendarModal({ isOpen, onClose, opportunities }: Props) {
  if (!isOpen) return null;

  const validDeadlines = opportunities.filter(o => o.deadline !== 'Rolling').sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  const rolling = opportunities.filter(o => o.deadline === 'Rolling');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 9999 }}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative z-10 max-h-full flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-stone-900">Application Deadlines</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {validDeadlines.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4">Upcoming Deadlines</h4>
                  <div className="space-y-3">
                    {validDeadlines.map(opp => {
                      const date = new Date(opp.deadline);
                      const month = date.toLocaleString('default', { month: 'short' });
                      const day = date.getDate();
                      const year = date.getFullYear();

                      return (
                        <div key={opp.id} className="flex gap-4 p-4 border border-stone-200 rounded-xl hover:border-indigo-200 transition-colors bg-stone-50/50">
                          <div className="flex flex-col items-center justify-center w-14 h-14 bg-white border border-stone-200 rounded-lg shadow-sm shrink-0">
                            <span className="text-[11px] font-bold text-red-500 uppercase">{month}</span>
                            <span className="text-xl font-bold text-stone-800 leading-none">{day}</span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-stone-900 leading-tight mb-1">{opp.title}</h5>
                            <div className="flex items-center gap-3 text-[13px] text-stone-500">
                              <span>{opp.type}</span>
                              <span>&bull;</span>
                              <span>Due: {month} {day}, {year}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {rolling.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Rolling Applications
                  </h4>
                  <div className="space-y-3">
                    {rolling.map(opp => (
                      <div key={opp.id} className="flex gap-4 p-4 border border-stone-200 rounded-xl hover:border-indigo-200 transition-colors bg-stone-50/50">
                        <div className="flex flex-col items-center justify-center w-14 h-14 bg-white border border-stone-200 rounded-lg shadow-sm shrink-0 text-stone-400">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-stone-900 leading-tight mb-1">{opp.title}</h5>
                          <div className="flex items-center gap-3 text-[13px] text-stone-500">
                            <span>{opp.type}</span>
                            <span>&bull;</span>
                            <span>Apply anytime</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
