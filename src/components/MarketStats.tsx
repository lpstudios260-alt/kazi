import React, { useState } from 'react';
import { Search, Loader2, Link2, ExternalLink, Activity, Mail, Sparkles, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';

interface StatLink {
  uri: string;
  title: string;
}

interface StatResult {
  text: string;
  links: StatLink[];
}

export function MarketStats() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<StatResult | null>(null);
  const [activeTab, setActiveTab] = useState<'deep-dive' | 'proactive'>('proactive');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/market-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch market stats');
      }

      const data = await res.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        text: `Error: ${error.message || 'Failed to fetch information'}`,
        links: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#FAFAFA] text-stone-900 selection:bg-stone-200 hide-scrollbar pb-12">
      <div className="max-w-4xl mx-auto w-full px-8 pt-16 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-stone-200/60 p-2.5 rounded-xl text-stone-600 block">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-3xl font-bold text-stone-900 tracking-snug">
              Market Intelligence
            </h1>
          </div>
          
          <div className="flex items-center gap-1 bg-stone-200/50 p-1 rounded-xl w-fit mb-8">
            <button
              onClick={() => setActiveTab('proactive')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'proactive'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Clock className="w-4 h-4" /> Weekly Digest
            </button>
            <button
              onClick={() => setActiveTab('deep-dive')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'deep-dive'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Search className="w-4 h-4" /> Deep Dive
            </button>
          </div>
        </motion.div>

        {activeTab === 'proactive' ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Mail className="w-48 h-48 rotate-12" />
              </div>
              <div className="max-w-xl position-relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-100">
                  <Sparkles className="w-3 h-3" /> Asynchronous Research
                </div>
                <h2 className="text-2xl font-bold text-stone-900 mb-3">
                  Proactive Market Monitoring
                </h2>
                <p className="text-stone-500 mb-6 leading-relaxed">
                  The most effective market intelligence runs in the background. Setup a weekly digest, and your agent will continuously monitor competitor activity, industry news, and trend shifts for your startup's profile context, delivering a clean report to your inbox every Monday morning.
                </p>
                <button 
                  onClick={() => setIsSubscribed(!isSubscribed)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2 ${isSubscribed ? 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
                >
                  {isSubscribed ? <><Clock className="w-4 h-4" /> Subscribed to Weekly Reports</> : 'Subscribe to Weekly Reports'}
                </button>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-6">Latest Digest Example (June 2026)</h3>
              <div className="space-y-6">
                <div className="p-4 bg-white border border-stone-200 rounded-xl">
                  <h4 className="font-bold text-stone-900 mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Competitor Movement
                  </h4>
                  <p className="text-sm text-stone-600 line-clamp-2">Acme Corp recently launched their new AI integrations, shifting their pricing model to a usage-based tier. We recommend reviewing your pricing page to ensure feature parity stands out.</p>
                </div>
                <div className="p-4 bg-white border border-stone-200 rounded-xl">
                  <h4 className="font-bold text-stone-900 mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Opportunity Identified
                  </h4>
                  <p className="text-sm text-stone-600 line-clamp-2">Search volume for "sustainable fintech" in your target region has increased by 42% this week. There is a strong content marketing angle here.</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <form onSubmit={handleSubmit} className="mb-10 w-full">
              <div className="flex items-center gap-2 bg-white border border-stone-200 p-2 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-stone-200 focus-within:border-transparent transition-all">
                <Search className="w-5 h-5 text-stone-400 ml-2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. 'What is the current fintech investment trend in Nigeria?'"
                  className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-[15px] text-stone-800 placeholder-stone-400"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="bg-stone-900 text-white px-5 py-2.5 rounded-xl text-[14px] font-medium disabled:opacity-50 hover:bg-stone-800 transition-colors flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Research'
                  )}
                </button>
              </div>
            </form>

            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row gap-8"
              >
                <div className="flex-1 min-w-0 font-serif leading-relaxed text-[15px] text-stone-800 prose prose-stone max-w-none prose-headings:font-serif prose-headings:font-medium prose-p:leading-relaxed prose-a:text-blue-600 hover:prose-a:text-blue-700">
                  <ReactMarkdown>{result.text}</ReactMarkdown>
                </div>
                
                {(result.links && result.links.length > 0) && (
                  <div className="w-full md:w-64 shrink-0 border-t md:border-t-0 md:border-l border-stone-100 pt-6 md:pt-0 md:pl-6">
                    <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5" /> Sources
                    </h3>
                    <div className="flex flex-col gap-3">
                      {result.links.map((link, idx) => (
                        <a 
                          key={idx}
                          href={link.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col gap-1 p-3 rounded-xl hover:bg-stone-50 border border-transparent hover:border-stone-100 transition-colors"
                        >
                          <span className="text-[13px] font-medium text-stone-700 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {link.title}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-stone-400">
                            <ExternalLink className="w-3 h-3" /> Visit source
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
