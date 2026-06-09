import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Loader2, Link2, Monitor, Mic, ArrowUp, Plus, LayoutTemplate, Globe, MonitorSmartphone, PenTool, ShieldCheck, TrendingUp, Paperclip, X, Triangle, ChevronRight, Image as ImageIcon, Square, RefreshCcw, Edit2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, ChatAttachment } from '../types';
import { AGENTS } from '../agents';
import { SlideDeckPreview } from './SlideDeckPreview';
import { InlineImageGenerator } from './InlineImageGenerator';
import { DrivePickerModal } from './DrivePickerModal';

interface ChatInterfaceProps {
  activeAgent: string;
  setActiveAgent: (id: string) => void;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
}

export function ChatInterface({ activeAgent, setActiveAgent, currentSessionId, setCurrentSessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingInput, setEditingInput] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setShowPlusMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          setPendingAttachments(prev => [...prev, {
            name: file.name,
            mimeType: file.type,
            data: base64data
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  
  // Load session if changed
  useEffect(() => {
    if (currentSessionId) {
      import('../lib/sessions').then(({ getSession }) => {
        getSession(currentSessionId).then(session => {
          if (session) setMessages(session.messages);
        }).catch(err => console.error("Failed to load session", err));
      });
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && pendingAttachments.length === 0) || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
      attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setPendingAttachments([]);
    
    await submitMessages(newMessages);
  };

  const submitMessages = async (newMessages: ChatMessage[]) => {
    setIsLoading(true);
    console.log("submitMessages: started");
    abortControllerRef.current = new AbortController();

    let activeSessionId = currentSessionId;

    try {
      if (!activeSessionId) {
        console.log("submitMessages: creating session");
        const { createSession } = await import('../lib/sessions');
        const lastUserMessage = newMessages[newMessages.length - 1];
        const sessionTitle = lastUserMessage?.text ? lastUserMessage.text.substring(0, 50) + '...' : 'New Chat';
        activeSessionId = await createSession(sessionTitle, newMessages);
        setCurrentSessionId(activeSessionId);
        console.log("submitMessages: session created", activeSessionId);
      } else {
        console.log("submitMessages: updating session");
        const { updateSessionMessages } = await import('../lib/sessions');
        await updateSessionMessages(activeSessionId, newMessages);
        console.log("submitMessages: session updated");
      }

      console.log("submitMessages: preparing fetch");
      const historyForApi = newMessages.map(m => ({
        role: m.role,
        parts: [
          ...(m.text ? [{ text: m.text }] : []),
          ...(m.attachments || []).map(att => ({
            inlineData: { mimeType: att.mimeType, data: att.data }
          }))
        ]
      }));
      
      const contents = historyForApi;

      console.log("submitMessages: sending fetch");
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contents, agentId: activeAgent }),
        signal: abortControllerRef.current.signal
      });

      console.log("submitMessages: fetch returned", res.status);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch response');
      }

      const data = await res.json();
      console.log("submitMessages: parsed JSON");
      
      const modelMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.text,
        timestamp: new Date()
      };

      const finalMessages = [...newMessages, modelMessage];
      setMessages(finalMessages);
      
      if (activeSessionId) {
        const { updateSessionMessages } = await import('../lib/sessions');
        await updateSessionMessages(activeSessionId, finalMessages);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('abort'))) {
        console.log("Request aborted");
        setMessages(newMessages);
        if (activeSessionId) {
          const { updateSessionMessages } = await import('../lib/sessions');
          await updateSessionMessages(activeSessionId, newMessages);
        }
        return;
      }
      console.error(err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: err.message || "I encountered an error trying to process that request. Please try again.",
        timestamp: new Date()
      };
      
      const errorMessages = [...newMessages, errorMessage];
      setMessages(errorMessages);
      
      if (activeSessionId) {
        const { updateSessionMessages } = await import('../lib/sessions');
        await updateSessionMessages(activeSessionId, errorMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleReload = () => {
    if (messages.length === 0 || isLoading) return;
    
    // Determine the last messages to resubmit. 
    // If last message is from model, remove it and resubmit.
    let newMessages = [...messages];
    if (newMessages[newMessages.length - 1].role === 'model') {
      newMessages.pop();
    }
    setMessages(newMessages);
    submitMessages(newMessages);
  };

  const handleEditStart = (messageId: string, text: string) => {
    setEditingMessageId(messageId);
    setEditingInput(text);
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditingInput('');
  };

  const handleEditSubmit = () => {
    if (!editingInput.trim() || !editingMessageId) return;

    // Find the message index
    const msgIndex = messages.findIndex(m => m.id === editingMessageId);
    if (msgIndex === -1) return;

    // Truncate message history up to this message, and replace its text
    const newMessages = messages.slice(0, msgIndex + 1);
    newMessages[msgIndex] = { ...newMessages[msgIndex], text: editingInput };
    
    setMessages(newMessages);
    setEditingMessageId(null);
    setEditingInput('');
    submitMessages(newMessages);
  };

  const isInitial = messages.length === 0;

  const currentAgent = AGENTS.find(a => a.id === activeAgent) || AGENTS[0];

  const renderInputBox = (isCentered?: boolean) => (
    <div className={`w-full bg-white border border-stone-200 rounded-2xl shadow-sm focus-within:shadow-md focus-within:border-stone-300 transition-all ${isCentered ? 'max-w-3xl mx-auto' : ''}`}>
      <form onSubmit={handleSubmit} className="flex flex-col">
        {pendingAttachments.length > 0 && (
          <div className="px-4 pt-4 flex flex-wrap gap-2">
            {pendingAttachments.map((att, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-stone-100 border border-stone-200 rounded-lg px-2 py-1 relative pr-8">
                {att.mimeType.startsWith('image/') ? (
                  <img src={`data:${att.mimeType};base64,${att.data}`} alt={att.name} className="w-6 h-6 object-cover rounded" />
                ) : (
                  <Paperclip className="w-4 h-4 text-stone-500" />
                )}
                <span className="text-[12px] font-medium text-stone-700 truncate max-w-[120px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute right-1 text-stone-400 hover:text-stone-700 p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          rows={1}
          placeholder="Assign a task or ask anything"
          className="w-full bg-transparent px-4 pt-4 pb-3 text-stone-800 placeholder:text-stone-400 focus:outline-none resize-none min-h-[90px] max-h-[300px]"
        />
        
        <input 
          type="file" 
          ref={fileInputRef} 
          hidden 
          multiple 
          onChange={handleFileChange} 
        />
        
        <div className="px-3 pb-3 flex items-center justify-between relative">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="relative" ref={plusMenuRef}>
              <button 
                type="button" 
                onClick={() => setShowPlusMenu(!showPlusMenu)}
                className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${showPlusMenu ? 'bg-stone-200 text-stone-800' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-200'}`}
              >
                <Plus className={`w-[22px] h-[22px] transition-transform duration-200 ${showPlusMenu ? 'rotate-45' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showPlusMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-[calc(100%+8px)] left-0 w-[260px] bg-[#222222] border border-stone-700/50 rounded-[20px] shadow-2xl overflow-hidden py-2 z-50 text-stone-200"
                  >
                    <button onClick={() => { fileInputRef.current?.click(); setShowPlusMenu(false); }} className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-stone-700/50 transition-colors text-[14px]">
                      <Paperclip className="w-[18px] h-[18px] text-stone-300" /> <span className="font-medium text-stone-200">Upload files</span>
                    </button>
                    <button onClick={() => { setShowPlusMenu(false); setShowDrivePicker(true); }} className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-stone-700/50 transition-colors text-[14px]">
                      <Triangle className="w-[18px] h-[18px] text-stone-300" /> <span className="font-medium text-stone-200">Add from Google Drive</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button 
                type="button" 
                onClick={() => setShowAgentMenu(!showAgentMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg text-[13px] font-medium transition-colors"
                title="Select Agent"
              >
                <currentAgent.icon className="w-[16px] h-[16px]" />
                {currentAgent.name}
              </button>
              
              <AnimatePresence>
                {showAgentMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAgentMenu(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-[calc(100%+8px)] left-0 w-56 bg-white border border-stone-200 shadow-xl rounded-xl z-50 overflow-hidden py-1.5"
                    >
                      <div className="px-3 py-2 border-b border-stone-100 mb-1">
                        <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">Select Agent</p>
                      </div>
                      {AGENTS.map(agent => (
                        <button
                          key={agent.id}
                          type="button"
                          onClick={() => {
                            setActiveAgent(agent.id);
                            setShowAgentMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-stone-50 transition-colors ${activeAgent === agent.id ? 'text-stone-900 font-medium bg-stone-50' : 'text-stone-600'}`}
                        >
                          <agent.icon className="w-4 h-4 text-stone-400" />
                          {agent.name}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button type="button" className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </button>
            <button type="button" className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors">
              <Mic className="w-[18px] h-[18px]" />
            </button>
            {isLoading ? (
              <button
                type="button"
                onClick={handleStop}
                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors ml-1"
                title="Stop generation"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && pendingAttachments.length === 0}
                className="p-1.5 bg-stone-100 hover:bg-stone-200 disabled:bg-stone-50 disabled:text-stone-300 text-stone-800 rounded-lg transition-colors ml-1"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#FAFAFA] text-stone-900 relative z-10 selection:bg-stone-200">
      
      {/* Top Header */}
      <header className="h-16 px-6 flex items-center justify-end shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-full shadow-sm text-[13px] font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer transition-colors">
          <Sparkles className="w-3.5 h-3.5 text-stone-400" />
          300
        </div>
      </header>


      <div className="flex-1 overflow-y-auto px-4 md:px-8 scroll-smooth flex flex-col relative z-10">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col relative">
          
          {isInitial ? (
            <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-20">
              <div className="mb-8 flex items-center gap-3 text-[13px] font-medium text-stone-600 bg-stone-100/50 px-4 py-1.5 rounded-full border border-stone-200/60 shadow-sm">
                <span>Free plan</span>
                <span className="w-px h-3 bg-stone-300"></span>
                <span className="text-blue-600 hover:underline cursor-pointer">Upgrade</span>
              </div>
              
              <h1 className="text-3xl md:text-[44px] text-center text-stone-800 mb-10 font-serif tracking-tight" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>
                What can I do for you?
              </h1>

              {renderInputBox(true)}

              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8">
                <button onClick={() => setInput("Create slides")} className="px-4 py-2 rounded-full border border-stone-200 bg-white text-stone-700 text-[13px] font-medium hover:bg-stone-50 hover:border-stone-300 transition-colors flex items-center gap-2 shadow-sm">
                  <LayoutTemplate className="w-3.5 h-3.5 text-stone-400" /> Create slides
                </button>
                <button onClick={() => setInput("Build website")} className="px-4 py-2 rounded-full border border-stone-200 bg-white text-stone-700 text-[13px] font-medium hover:bg-stone-50 hover:border-stone-300 transition-colors flex items-center gap-2 shadow-sm">
                  <Globe className="w-3.5 h-3.5 text-stone-400" /> Build website
                </button>
                <button onClick={() => setInput("Develop desktop apps")} className="px-4 py-2 rounded-full border border-stone-200 bg-white text-stone-700 text-[13px] font-medium hover:bg-stone-50 hover:border-stone-300 transition-colors flex items-center gap-2 shadow-sm">
                  <MonitorSmartphone className="w-3.5 h-3.5 text-stone-400" /> Develop desktop apps
                </button>
                <button onClick={() => setInput("Design")} className="px-4 py-2 rounded-full border border-stone-200 bg-white text-stone-700 text-[13px] font-medium hover:bg-stone-50 hover:border-stone-300 transition-colors flex items-center gap-2 shadow-sm">
                  <PenTool className="w-3.5 h-3.5 text-stone-400" /> Design
                </button>
                <button className="px-4 py-2 rounded-full border border-stone-200 bg-white text-stone-700 text-[13px] font-medium hover:bg-stone-50 hover:border-stone-300 transition-colors shadow-sm">
                  More
                </button>
              </div>

              <div className="mt-16 w-full max-w-[500px] mx-auto bg-white border border-stone-200/80 p-5 rounded-2xl flex items-center justify-between shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] cursor-pointer hover:border-stone-300 transition-colors hover:shadow-md group">
                <div>
                  <h3 className="text-[15px] font-semibold text-stone-800">Personalize your Nova AI</h3>
                  <p className="text-[13px] text-stone-500 mt-1">Let Nova AI know more about you.</p>
                </div>
                <div className="w-24 h-16 bg-stone-50 rounded-xl flex items-center justify-center text-xs text-stone-400 border border-stone-200/60 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                   <div className="absolute top-2 left-2 flex flex-col gap-1">
                     <div className="w-3 h-3 bg-stone-200 rounded-sm"></div>
                     <div className="w-3 h-3 bg-stone-200 rounded-sm"></div>
                   </div>
                   <div className="absolute top-2 right-2 w-10 h-1.5 bg-stone-200 rounded-full"></div>
                   <div className="absolute top-5 right-2 w-10 h-1 bg-stone-200 rounded-full"></div>
                   <div className="absolute bottom-2 right-2 w-10 h-6 bg-blue-100/60 rounded flex items-center justify-center border border-blue-200/40">
                     <div className="w-4 h-2 bg-blue-300/40 rounded-sm"></div>
                   </div>
                </div>
              </div>
              <div className="flex justify-center gap-2 mt-6">
                <div className="w-1.5 h-1.5 rounded-full bg-stone-800"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-stone-300"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-stone-300"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-stone-300"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 mt-6 pb-10">
               {messages.map((message) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={message.id} 
                  className={`flex gap-4 relative z-10 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'model' && (
                    <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-stone-800 border border-stone-800 shadow-sm mt-1 text-white">
                      <span className="font-bold text-xs uppercase">kz</span>
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] sm:max-w-[75%] ${
                    message.role === 'user' 
                      ? 'bg-stone-100/80 text-stone-800 px-5 py-3.5 rounded-2xl rounded-tr-sm' 
                      : 'bg-transparent border-none py-1 w-full min-w-0'
                  }`}>
                    {message.role === 'model' ? (() => {
                      const pptxMatch = message.text.match(/```pptx_json\n([\s\S]*?)```/);
                      if (pptxMatch) {
                        try {
                          const data = JSON.parse(pptxMatch[1]);
                          const replacedText = message.text.replace(pptxMatch[0], '');
                          return (
                            <div className="w-full flex-1">
                              {replacedText.trim() && (
                                <div className="prose prose-stone max-w-none prose-p:leading-relaxed prose-pre:bg-stone-100 prose-pre:border prose-pre:border-stone-200/60 prose-pre:overflow-x-auto prose-p:text-stone-800 prose-headings:text-stone-900 prose-strong:text-stone-900 text-[15px] break-words overflow-hidden min-w-0">
                                  <ReactMarkdown>{replacedText}</ReactMarkdown>
                                </div>
                              )}
                              <SlideDeckPreview data={data} />
                            </div>
                          );
                        } catch (e) {
                          console.error("Failed to parse pptx JSON", e);
                        }
                      }
                      
                      const imageMatch = message.text.match(/```image_prompt\n([\s\S]*?)```/);
                      if (imageMatch) {
                        const imagePrompt = imageMatch[1];
                        const replacedText = message.text.replace(imageMatch[0], '');
                        return (
                          <div className="w-full flex-1 max-w-2xl">
                              {replacedText.trim() && (
                                <div className="prose prose-stone max-w-none prose-p:leading-relaxed prose-pre:bg-stone-100 prose-pre:border prose-pre:border-stone-200/60 prose-pre:overflow-x-auto prose-p:text-stone-800 prose-headings:text-stone-900 prose-strong:text-stone-900 text-[15px] break-words overflow-hidden min-w-0">
                                  <ReactMarkdown>{replacedText}</ReactMarkdown>
                                </div>
                              )}
                              <InlineImageGenerator prompt={imagePrompt.trim()} />
                          </div>
                        );
                      }

                      return (
                        <div className="relative group pr-8 max-w-full">
                          <div className="prose prose-stone max-w-none prose-p:leading-relaxed prose-pre:bg-stone-100 prose-pre:border prose-pre:border-stone-200/60 prose-pre:overflow-x-auto prose-p:text-stone-800 prose-headings:text-stone-900 prose-strong:text-stone-900 text-[15px] break-words overflow-hidden min-w-0">
                            <ReactMarkdown>{message.text}</ReactMarkdown>
                          </div>
                          <div className="absolute top-0 -right-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={handleReload}
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors bg-white shadow-sm border border-stone-200/60"
                              title="Regenerate"
                            >
                              <RefreshCcw className="w-[14px] h-[14px]" />
                            </button>
                          </div>
                        </div>
                      );
                    })() : (
                        <div className="group relative pr-8">
                          {editingMessageId === message.id ? (
                            <div className="flex flex-col gap-2 min-w-[250px]">
                              <textarea
                                value={editingInput}
                                onChange={(e) => setEditingInput(e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-lg p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-stone-400 resize-y min-h-[60px]"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={handleEditCancel} className="p-1 text-stone-500 hover:bg-stone-200 rounded">
                                  <X className="w-4 h-4" />
                                </button>
                                <button onClick={handleEditSubmit} className="p-1 bg-stone-800 text-white hover:bg-stone-700 rounded">
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-1">
                                  {message.attachments.map((att, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-stone-200/50 rounded-lg px-2 py-1">
                                      {att.mimeType.startsWith('image/') ? (
                                        <img src={`data:${att.mimeType};base64,${att.data}`} alt={att.name} className="w-8 h-8 object-cover rounded shadow-sm border border-stone-200/50" />
                                      ) : (
                                        <Paperclip className="w-4 h-4 text-stone-500" />
                                      )}
                                      <span className="text-[12px] font-medium text-stone-700 max-w-[150px] truncate">{att.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {message.text && (
                                <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{message.text}</p>
                              )}
                              <div className="absolute top-0 -left-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditStart(message.id, message.text)}
                                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors bg-stone-100/80 shadow-sm"
                                  title="Edit message"
                                >
                                  <Edit2 className="w-[14px] h-[14px]" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4 justify-start relative z-10"
                >
                   <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-stone-800 border border-stone-800 shadow-sm mt-1 text-white">
                      <span className="font-bold text-xs uppercase">kz</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-500 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                      <span className="text-[15px]">Thinking...</span>
                    </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {!isInitial && (
        <div className="w-full max-w-3xl mx-auto px-4 pb-6 shrink-0 relative z-20">
          {renderInputBox()}
          <div className="text-center mt-2.5">
             <span className="text-[11px] text-stone-400 font-medium">Nova AI can make mistakes. Verify critical setup steps.</span>
          </div>
        </div>
      )}

      {showDrivePicker && (
        <DrivePickerModal 
          onClose={() => setShowDrivePicker(false)} 
          onSelect={(files) => setPendingAttachments(prev => [...prev, ...files])} 
        />
      )}
    </div>
  );
}