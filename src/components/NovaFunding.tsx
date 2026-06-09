import React, { useState } from 'react';
import { Search, Filter, Briefcase, Zap, CheckCircle2, ChevronRight, LayoutDashboard, Globe, TrendingUp, Sparkles, AlertCircle, Calendar, Star, FileText, ArrowRight, Download, Eye, Target, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FundingPipelineChart } from './FundingPipelineChart';
import { FundingCalendarModal } from './FundingCalendarModal';

interface Opportunity {
  id: string;
  title: string;
  source: string;
  type: string;
  deadline: string;
  fitScore: number;
  winProbability: 'High' | 'Medium' | 'Low';
  amount: string;
  status: 'New' | 'Review' | 'Apply' | 'Submitted' | 'Archived';
  description: string;
}

const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    title: 'Global Entrepreneurship Programme',
    source: 'GEP Portal',
    type: 'Monetary Grant & Mentorship',
    deadline: '2026-03-01',
    fitScore: 94,
    winProbability: 'High',
    amount: '$25,000',
    status: 'Review',
    description: 'Aimed at empowering early-stage tech entrepreneurs with $25,000 direct non-refundable seed capital, alongside business training, and networking.'
  },
  {
    id: '2',
    title: 'AWS Activate Global Focus',
    source: 'AWS Startup Portal',
    type: 'Non-Monetary (Cloud Credits)',
    deadline: 'Rolling',
    fitScore: 88,
    winProbability: 'High',
    amount: 'Up to $100k in Credits',
    status: 'New',
    description: 'Provides scale-up cloud infrastructure credits, technical support, and architectural guidance for tech startups based globally.'
  },
  {
    id: '3',
    title: 'Y Combinator Winter 2027',
    source: 'ycombinator.com',
    type: 'Equity Investment',
    deadline: '2026-09-10',
    fitScore: 76,
    winProbability: 'Medium',
    amount: '$500,000 for 7%',
    status: 'Apply',
    description: 'Standard YC deal: $500k total ($125k for 7% and $375k uncapped SAFE). Intensive remote 3-month accelerator program culminating in Demo Day.'
  },
  {
    id: '4',
    title: 'Google for Startups Fund',
    source: 'Google Grants',
    type: 'Monetary Grant & Credits',
    deadline: '2026-05-31',
    fitScore: 82,
    winProbability: 'Medium',
    amount: 'Up to $100,000',
    status: 'New',
    description: 'Provides non-dilutive cash awards up to $100,000 to innovative startups, along with $200k in Google Cloud Credits and hands-on Google mentorship.'
  }
];

export function NovaFunding() {
  const [activeView, setActiveView] = useState<'list' | 'detail'>('list');
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'draft' | 'readiness' | 'insights'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSelectOpp = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setActiveView('detail');
    setWorkspaceTab('overview');
  };

  const handleGenerateDraft = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setWorkspaceTab('draft');
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-stone-600';
  };

  const getProbabilityBadge = (prob: string) => {
    switch(prob) {
      case 'High': return 'bg-emerald-100 text-emerald-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'Low': return 'bg-stone-100 text-stone-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] font-sans">
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeView === 'list' ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 flex flex-col p-8 lg:px-12 overflow-y-auto"
            >
              <div className="max-w-6xl mx-auto w-full">
                <header className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                      <Target className="w-5 h-5" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Funding</h1>
                  </div>
                  <p className="text-stone-500 text-[15px]">AI-powered opportunity scanner matching grants, equity, and programs to your company profile.</p>
                </header>

                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input 
                      type="text"
                      placeholder="Search opportunities, sources, or keywords..."
                      className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsCalendarOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-[14px] text-stone-700 font-medium hover:bg-stone-50 transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      Calendar
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-[14px] text-stone-700 font-medium hover:bg-stone-50 transition-colors">
                      <Filter className="w-4 h-4" />
                      Filters
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-indigo-600 rounded-xl text-[14px] text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                      <Zap className="w-4 h-4" />
                      Scan Now
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-2 space-y-4">
                    {mockOpportunities.filter(o => o.title.toLowerCase().includes(searchQuery.toLowerCase())).map(opp => (
                      <div 
                        key={opp.id} 
                        onClick={() => handleSelectOpp(opp)}
                        className="p-5 bg-white border border-stone-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[12px] font-medium px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md">{opp.type}</span>
                            <span className={`text-[12px] font-medium px-2 py-0.5 rounded-md ${getProbabilityBadge(opp.winProbability)}`}>
                              {opp.winProbability} Win Prob
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <Star className="w-3.5 h-3.5" />
                            <span className="text-sm">{opp.fitScore}% Fit</span>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-stone-900 group-hover:text-indigo-700 transition-colors mb-1">{opp.title}</h3>
                        <p className="text-stone-500 text-[14px] line-clamp-2 md:w-5/6 mb-4">{opp.description}</p>
                        
                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-stone-100 text-[13px] text-stone-500">
                          <div className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> {opp.source}</div>
                          <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {opp.amount}</div>
                          <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {opp.deadline}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                      <h4 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-stone-400" />
                        Pipeline Health
                      </h4>
                      <FundingPipelineChart data={[
                        { status: 'New', count: 24, color: '#f3f4f6' },
                        { status: 'Review', count: 4, color: '#fde68a' },
                        { status: 'Applying', count: 1, color: '#bfdbfe' },
                        { status: 'Submitted', count: 12, color: '#a7f3d0' }
                      ]} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 flex flex-col bg-white"
            >
               {selectedOpp && (
                 <>
                  <div className="h-16 border-b border-stone-200 flex items-center justify-between px-6 bg-stone-50/50">
                    <button 
                      onClick={() => setActiveView('list')}
                      className="flex items-center text-[14px] font-medium text-stone-500 hover:text-stone-900 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180 mr-1" /> Back to Scanner
                    </button>
                    <div className="flex items-center gap-3">
                       <select className="bg-white border border-stone-200 rounded-lg text-[13px] px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                         <option>Status: {selectedOpp.status}</option>
                         <option>Reviewing...</option>
                         <option>Archive</option>
                       </select>
                    </div>
                  </div>

                  <div className="flex-1 flex overflow-hidden">
                    <div className="w-1/3 border-r border-stone-200 overflow-y-auto p-6 bg-[#FAFAFA]">
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Nova AI Matched</span>
                        </div>
                        <h2 className="text-2xl font-bold text-stone-900 mb-2 leading-tight">{selectedOpp.title}</h2>
                        <p className="text-[15px] text-stone-600 leading-relaxed mb-4">{selectedOpp.description}</p>
                        
                        <div className="grid grid-cols-2 gap-3 mb-6">
                           <div className="bg-white p-3 rounded-xl border border-stone-200">
                             <div className="text-[12px] text-stone-500 mb-1">Fit Score</div>
                             <div className={`text-xl font-bold ${getScoreColor(selectedOpp.fitScore)}`}>{selectedOpp.fitScore}%</div>
                           </div>
                           <div className="bg-white p-3 rounded-xl border border-stone-200">
                             <div className="text-[12px] text-stone-500 mb-1">Win Probability</div>
                             <div className={`text-sm font-bold ${selectedOpp.winProbability === 'High' ? 'text-emerald-700' : 'text-stone-700'}`}>{selectedOpp.winProbability}</div>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button 
                          onClick={() => setWorkspaceTab('overview')}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors ${workspaceTab === 'overview' ? 'bg-white border border-stone-200 text-stone-900 shadow-sm' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700 border border-transparent'}`}
                        >
                          <Globe className="w-4 h-4" /> Source Details
                        </button>
                        <button 
                          onClick={() => setWorkspaceTab('readiness')}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors ${workspaceTab === 'readiness' ? 'bg-white border border-stone-200 text-stone-900 shadow-sm' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700 border border-transparent'}`}
                        >
                          <AlertCircle className="w-4 h-4" /> Readiness Report
                        </button>
                        <button 
                          onClick={() => setWorkspaceTab('draft')}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors ${workspaceTab === 'draft' ? 'bg-white border border-stone-200 text-stone-900 shadow-sm' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700 border border-transparent'}`}
                        >
                          <Sparkles className="w-4 h-4" /> AI Application Draft
                        </button>
                        <button 
                          onClick={() => setWorkspaceTab('insights')}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors ${workspaceTab === 'insights' ? 'bg-white border border-stone-200 text-stone-900 shadow-sm' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700 border border-transparent'}`}
                        >
                          <TrendingUp className="w-4 h-4" /> Funder Insights
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 relative">
                      {workspaceTab === 'overview' && (
                        <div className="max-w-3xl">
                          <h3 className="text-xl font-bold text-stone-900 mb-6">Source Analysis</h3>
                          <div className="prose prose-stone prose-sm">
                            <p><strong>Funding Type:</strong> {selectedOpp.type}</p>
                            <p><strong>Value:</strong> {selectedOpp.amount}</p>
                            <p><strong>Deadline Requirement:</strong> {selectedOpp.deadline === 'Rolling' ? 'Rolling Basis (Apply anytime)' : `Strict Deadline: ${selectedOpp.deadline}`}</p>
                            <p><strong>Target Demographic:</strong> Startups, Early stage, Tech-enabled.</p>
                            <hr />
                            <h5>Why Nova matched this:</h5>
                            <ul>
                              <li>Your company profile indicates you are pre-seed in emerging markets.</li>
                              <li>Your revenue numbers ($12k MRR) qualify for the growth track.</li>
                              <li>The source specifically asks for female co-founders (Fit: Yes).</li>
                            </ul>
                          </div>
                          
                          <div className="mt-8 flex justify-end">
                            <button 
                              onClick={handleGenerateDraft}
                              disabled={isGenerating}
                              className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-stone-800 transition-colors"
                            >
                              {isGenerating ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing Requirements...</>
                              ) : (
                                <><Sparkles className="w-4 h-4" /> Build Application Pack</>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {workspaceTab === 'readiness' && (
                        <div className="max-w-3xl">
                          <h3 className="text-xl font-bold text-stone-900 mb-6">Readiness Report</h3>
                          <div className="space-y-4">
                            <div className="p-4 border-l-4 border-emerald-500 bg-emerald-50 rounded-r-xl">
                              <h5 className="font-semibold text-emerald-800 text-[14px] flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4" /> Legal Status</h5>
                              <p className="text-emerald-700 text-[13px]">Your CAC incorporation documents match the requirements.</p>
                            </div>
                            <div className="p-4 border-l-4 border-amber-500 bg-amber-50 rounded-r-xl">
                              <h5 className="font-semibold text-amber-800 text-[14px] flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4" /> Financial Projections</h5>
                              <p className="text-amber-800 text-[13px]">They require a 3-year projection. Your profile only has 1-year. Nova will extrapolate based on your growth rate.</p>
                            </div>
                            <div className="p-4 border-l-4 border-indigo-500 bg-indigo-50 rounded-r-xl">
                              <h5 className="font-semibold text-indigo-800 text-[14px] flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4" /> Pitch Deck</h5>
                              <p className="text-indigo-800 text-[13px]">Ready to generate. Nova will use your Q2 metrics.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {workspaceTab === 'draft' && (
                        <div className="max-w-4xl">
                           <div className="flex items-center justify-between mb-6">
                             <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                               <Sparkles className="w-5 h-5 text-indigo-600" />
                               Generated Application Pack
                             </h3>
                             <button className="flex items-center gap-2 text-[13px] font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors">
                               <Download className="w-4 h-4" /> Export Pack (.docx)
                             </button>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                             <div className="border border-stone-200 rounded-xl p-5 bg-white shadow-sm flex flex-col h-48 group">
                               <div className="flex items-center gap-2 text-stone-500 mb-3 text-[13px] uppercase tracking-wider font-semibold">
                                 <FileText className="w-4 h-4" /> Cover Letter
                               </div>
                               <p className="text-[13px] text-stone-600 line-clamp-4 flex-1">
                                 Dear Selection Committee,<br/><br/>As founders operating at the intersection of fintech and logistics globally, we recognize the profound impact that the {selectedOpp.title} could have...
                               </p>
                               <button className="text-indigo-600 text-[13px] font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                                 <Eye className="w-4 h-4" /> Review Full Text
                               </button>
                             </div>

                             <div className="border border-stone-200 rounded-xl p-5 bg-white shadow-sm flex flex-col h-48 group">
                               <div className="flex items-center gap-2 text-stone-500 mb-3 text-[13px] uppercase tracking-wider font-semibold">
                                 <Zap className="w-4 h-4" /> Form Q&A Generator
                               </div>
                               <div className="space-y-2 flex-1">
                                 <div className="bg-stone-50 p-2 text-[12px] text-stone-500 rounded border border-stone-100">Q: What is your primary traction?</div>
                                 <div className="text-[13px] text-stone-600 line-clamp-2 pl-2 border-l-2 border-indigo-200">A: We process over 10,000 MAUs...</div>
                               </div>
                               <button className="text-indigo-600 text-[13px] font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                                 Review 12 Answers <ArrowRight className="w-4 h-4" />
                               </button>
                             </div>
                           </div>
                           
                           <div className="p-5 border border-stone-200 rounded-xl bg-white shadow-sm flex items-center justify-between">
                             <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                 <LayoutDashboard className="w-6 h-6" />
                               </div>
                               <div>
                                 <h4 className="font-semibold text-stone-900">Themed Pitch Deck</h4>
                                 <p className="text-[13px] text-stone-500">12 Slides tailored to their specific scoring matrix</p>
                               </div>
                             </div>
                             <button className="px-4 py-2 bg-stone-900 text-white text-[13px] font-medium rounded-lg hover:bg-stone-800 transition-colors">
                               Open Builder
                             </button>
                           </div>
                        </div>
                      )}

                      {workspaceTab === 'insights' && (
                        <div className="max-w-3xl">
                          <h3 className="text-xl font-bold text-stone-900 mb-6">Historical Funder Insights</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm">
                              <h4 className="text-[13px] font-bold text-stone-500 uppercase tracking-wider mb-2">Success Rate</h4>
                              <div className="text-3xl font-bold text-indigo-600 mb-1">12.5%</div>
                              <p className="text-[13px] text-stone-500">Of applications proceed to final review</p>
                            </div>
                            <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm">
                              <h4 className="text-[13px] font-bold text-stone-500 uppercase tracking-wider mb-2">Avg. Review Time</h4>
                              <div className="text-3xl font-bold text-stone-900 mb-1">45 Days</div>
                              <p className="text-[13px] text-stone-500">From submission to initial feedback</p>
                            </div>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                              <h4 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
                                <History className="w-4 h-4 text-stone-400" />
                                Previous Funding History
                              </h4>
                              <div className="space-y-3">
                                 <div className="flex justify-between items-center text-[14px]">
                                   <span className="text-stone-600">Fintech</span>
                                   <span className="font-medium bg-stone-100 px-2 py-0.5 rounded text-stone-800">34 Grantees</span>
                                 </div>
                                 <div className="flex justify-between items-center text-[14px]">
                                   <span className="text-stone-600">Healthtech</span>
                                   <span className="font-medium bg-stone-100 px-2 py-0.5 rounded text-stone-800">28 Grantees</span>
                                 </div>
                                 <div className="flex justify-between items-center text-[14px]">
                                   <span className="text-stone-600">Edtech</span>
                                   <span className="font-medium bg-stone-100 px-2 py-0.5 rounded text-stone-800">19 Grantees</span>
                                 </div>
                              </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                              <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                                <Star className="w-4 h-4 text-indigo-500" />
                                Common Requirements
                              </h4>
                              <ul className="space-y-2 text-[14px] text-indigo-800/80">
                                <li className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                  <span>Clear path to profitability within 24 months.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                  <span>Strong technical co-founder with distinct operational experience.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                  <span>Demonstrated primary market traction (minimum 1,000 active users).</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                 </>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <FundingCalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
        opportunities={mockOpportunities} 
      />
    </div>
  );
}
