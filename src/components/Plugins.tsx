import React, { useState } from 'react';
import { Search, Plus, CheckCircle2, Circle, Settings2, Webhook, Database, Blocks, Globe, Mail, MessageSquare, Calendar } from 'lucide-react';

const mockPlugins = [
  { id: 'google-workspace', name: 'Google Workspace', description: 'Connect Calendar, Drive & Gmail to your agents.', icon: Calendar, category: 'Productivity', status: 'connected' },
  { id: 'slack', name: 'Slack Integration', description: 'Deploy agents into Slack channels and send notifications.', icon: MessageSquare, category: 'Communication', status: 'disconnected' },
  { id: 'stripe', name: 'Stripe', description: 'Process payments and manage subscriptions globally.', icon: Database, category: 'Finance', status: 'available' },
  { id: 'twilio', name: 'Twilio', description: 'Integrate SMS, USSD, Voice, and Airtime APIs for seamless communication.', icon: Webhook, category: 'Communication', status: 'available' },
  { id: 'paypal', name: 'PayPal API', description: 'Direct integration for digital money transactions and C2B/B2C payments.', icon: Globe, category: 'Finance', status: 'disconnected' },
  { id: 'whatsapp-business', name: 'WhatsApp Business', description: 'Deploy conversational agents globally via WhatsApp.', icon: MessageSquare, category: 'Communication', status: 'connected' },
  { id: 'notion', name: 'Notion Sync', description: 'Export agent research and meeting notes directly to Notion pages.', icon: Blocks, category: 'Knowledge', status: 'connected' },
  { id: 'custom-webhook', name: 'Custom Webhook', description: 'Send standard JSON payloads to arbitrary external endpoints.', icon: Globe, category: 'Developer', status: 'available' }
];

export function Plugins() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlugins = mockPlugins.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-y-auto">
      <header className="shrink-0 h-16 bg-white border-b border-stone-200 px-8 flex items-center justify-between sticky top-0 z-10">
        <h1 className="font-semibold text-lg">Plugins & Integrations</h1>
        <button className="h-9 px-4 bg-stone-900 text-white text-sm font-medium rounded-full shadow-sm hover:bg-stone-800 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Custom Plugin
        </button>
      </header>

      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="mb-8 max-w-xl relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search plugins (e.g. Google Workspace, Slack...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlugins.map(plugin => {
            const Icon = plugin.icon;
            return (
              <div key={plugin.id} className="bg-white border border-stone-200 rounded-2xl p-6 transition-all hover:shadow-md group flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6 text-stone-700" />
                  </div>
                  {plugin.status === 'connected' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected
                    </span>
                  ) : plugin.status === 'disconnected' ? (
                     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-50 text-stone-600 border border-stone-200">
                      <Circle className="w-3.5 h-3.5" />
                      Disconnected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      Available
                    </span>
                  )}
                </div>
                <div className="mb-4 flex-1">
                  <h3 className="font-semibold text-stone-900 mb-1">{plugin.name}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed line-clamp-2">{plugin.description}</p>
                </div>
                
                <div className="pt-4 border-t border-stone-100 flex items-center justify-between mt-auto">
                   <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">{plugin.category}</span>
                   <button className="text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1">
                     <Settings2 className="w-4 h-4" />
                     Configure
                   </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredPlugins.length === 0 && (
           <div className="text-center py-20">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Search className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-medium text-stone-900 mb-1">No plugins found</h3>
              <p className="text-stone-500">Try adjusting your search query.</p>
           </div>
        )}
      </div>
    </div>
  );
}
