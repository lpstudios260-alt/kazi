import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Loader2, Calendar as CalendarIcon, Clock, Video, Save, CheckCircle2, CloudUpload, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { getAccessToken } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  hangoutLink?: string;
}

interface MeetingWorkspaceProps {
  event: CalendarEvent;
  onBack: () => void;
}

export function MeetingWorkspace({ event, onBack }: MeetingWorkspaceProps) {
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingPrevNotes, setIsLoadingPrevNotes] = useState(true);

  const [leftPaneTab, setLeftPaneTab] = useState<'notes'|'video'>(event.hangoutLink ? 'video' : 'notes');
  const [rightPaneTab, setRightPaneTab] = useState<'summary'|'design'>('summary');

  const [designPrompt, setDesignPrompt] = useState('');
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState<{ rawBase64: string, mimeType: string, imageUrl: string } | null>(null);

  const [isExportingDoc, setIsExportingDoc] = useState(false);
  const [isExportingDesign, setIsExportingDesign] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreviousNotes = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'meetingNotes', `${auth.currentUser.uid}_${event.id}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.rawNotes) setNotes(data.rawNotes);
          if (data.aiSummary) setAiResult(data.aiSummary);
        }
      } catch (err) {
        console.error("Error fetching notes", err);
      } finally {
        setIsLoadingPrevNotes(false);
      }
    };
    fetchPreviousNotes();
  }, [event.id]);

  const handleProcessNotes = async () => {
    if (!notes.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/meeting-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process notes');
      }
      setAiResult(data.result);
      setRightPaneTab('summary');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateDesign = async () => {
    if (!designPrompt.trim()) return;
    setIsGeneratingDesign(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: designPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate design');
      setGeneratedDesign({ rawBase64: data.rawBase64, mimeType: data.mimeType, imageUrl: data.imageBase64 });
    } catch (err: any) {
      setError(err.message || 'Failed to generate design.');
    } finally {
      setIsGeneratingDesign(false);
    }
  };

  const exportToDrive = async (type: 'text' | 'image', content: string, filename: string, mimeType?: string) => {
    const token = await getAccessToken();
    if (!token) throw new Error("Google access token missing. Please sign in again.");

    const res = await fetch('/api/drive/export', {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ type, content, filename, mimeType }),
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to export");
    return data;
  };

  const handleExportText = async () => {
    if (!aiResult) return;
    setIsExportingDoc(true);
    setError(null);
    try {
      await exportToDrive("text", aiResult, `${event.summary || 'Meeting'} - Notes.txt`);
      setExportSuccessMsg("Notes exported to Google Drive!");
      setTimeout(() => setExportSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Export failed. Please check your permissions.");
    } finally {
      setIsExportingDoc(false);
    }
  };

  const handleExportDesign = async () => {
    if (!generatedDesign) return;
    setIsExportingDesign(true);
    setError(null);
    try {
      await exportToDrive("image", generatedDesign.rawBase64, `${event.summary || 'Meeting'} - Design.png`, generatedDesign.mimeType);
      setExportSuccessMsg("Design expected to Google Drive!");
      setTimeout(() => setExportSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Export failed.");
    } finally {
      setIsExportingDesign(false);
    }
  };

  const handleSaveToWorkspace = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const docRef = doc(db, 'meetingNotes', `${auth.currentUser.uid}_${event.id}`);
      const docSnap = await getDoc(docRef);
      
      const payload = {
        userId: auth.currentUser.uid,
        eventId: event.id,
        eventTitle: event.summary || '(No title)',
        rawNotes: notes,
        aiSummary: aiResult || '',
        updatedAt: serverTimestamp()
      };

      if (!docSnap.exists()) {
        await setDoc(docRef, { ...payload, createdAt: serverTimestamp() });
      } else {
        await setDoc(docRef, payload, { merge: true });
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Save error:", err);
      setError("Failed to save to workspace. Check permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  let dateStr = '';
  let timeStr = '';
  const d = event.start.dateTime ? new Date(event.start.dateTime) : (event.start.date ? new Date(event.start.date) : null);
  if (d) {
    dateStr = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    if (event.start.dateTime) {
      timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    } else {
      timeStr = 'All day';
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFA] text-stone-900 pb-12 selection:bg-stone-200">
      <div className="max-w-4xl mx-auto px-8 pt-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors text-sm font-semibold mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Schedule
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-3">
            {event.summary || '(No title)'}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-stone-500">
            <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-stone-400" /> {dateStr}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-stone-400" /> {timeStr}</span>
            {event.hangoutLink && (
              <button
                onClick={() => setLeftPaneTab('video')}
                className="flex items-center justify-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors bg-blue-50/50 px-2.5 py-1 rounded-md"
              >
                <Video className="w-4 h-4" /> Join Meeting
              </button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input/Video Side */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col h-[600px] bg-white border border-stone-200 rounded-3xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex bg-stone-100 p-1 rounded-lg">
                <button 
                  onClick={() => setLeftPaneTab('notes')}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${leftPaneTab === 'notes' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Notes
                </button>
                {event.hangoutLink && (
                  <button 
                    onClick={() => setLeftPaneTab('video')}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${leftPaneTab === 'video' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                  >
                    Video Call
                  </button>
                )}
              </div>
            </div>
            
            {leftPaneTab === 'notes' ? (
              <>
                <textarea
                  className="flex-1 w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-[15px] leading-relaxed text-stone-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                  placeholder="Paste the raw meeting transcript, your rough notes, or key discussion points here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100">
                    {error}
                  </div>
                )}
                <button
                  onClick={handleProcessNotes}
                  disabled={isProcessing || !notes.trim()}
                  className="mt-4 w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl flex justify-center items-center gap-2 transition-colors shadow-sm"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isProcessing ? 'Analyzing...' : 'Generate Summary & Actions'}
                </button>
              </>
            ) : (
              <div className="flex-1 w-full rounded-xl flex flex-col items-center justify-center p-8 text-center border border-stone-200">
                <Video className="w-12 h-12 text-stone-400 mb-4" />
                <h3 className="text-lg font-semibold text-stone-900 mb-2">Google Meet Security Restriction</h3>
                <p className="text-sm text-stone-500 mb-6 max-w-sm">
                  Google Meet enforces strict security policies (X-Frame-Options: deny) that prevent it from being embedded within other websites. It must be opened securely in its own tab.
                </p>
                <a 
                  href={event.hangoutLink}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Video className="w-4 h-4" /> Open in New Tab
                </a>
              </div>
            )}
          </motion.div>

          {/* AI Output Side */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col h-[600px] bg-stone-50 border border-stone-200 rounded-3xl p-6 shadow-sm overflow-hidden relative"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex bg-stone-200/50 p-1 rounded-lg">
                <button 
                  onClick={() => setRightPaneTab('summary')}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${rightPaneTab === 'summary' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  <Sparkles className="w-4 h-4 text-purple-500" /> Notes
                </button>
                <button 
                  onClick={() => setRightPaneTab('design')}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${rightPaneTab === 'design' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  <ImageIcon className="w-4 h-4 text-emerald-500" /> Designs
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleSaveToWorkspace}
                  disabled={isSaving || !notes.trim()}
                  title="Save locally"
                  className="flex items-center justify-center text-sm font-semibold bg-white border border-stone-200 shadow-sm text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors p-2 rounded-lg disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
                {rightPaneTab === 'summary' && aiResult && (
                  <button 
                    onClick={handleExportText}
                    disabled={isExportingDoc}
                    className="flex items-center gap-2 text-sm font-semibold bg-white border border-stone-200 shadow-sm text-stone-700 hover:text-blue-700 hover:bg-stone-50 transition-colors px-3 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    {isExportingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                    Export to Drive
                  </button>
                )}
                {rightPaneTab === 'design' && generatedDesign && (
                  <button 
                    onClick={handleExportDesign}
                    disabled={isExportingDesign}
                    className="flex items-center gap-2 text-sm font-semibold bg-white border border-stone-200 shadow-sm text-stone-700 hover:text-emerald-700 hover:bg-stone-50 transition-colors px-3 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    {isExportingDesign ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                    Save to Drive
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100">
                {error}
              </div>
            )}

            {(saveSuccess || exportSuccessMsg) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50/50 p-2.5 rounded-xl border border-green-100"
              >
                <CheckCircle2 className="w-4 h-4" /> {exportSuccessMsg || 'Saved successfully.'}
              </motion.div>
            )}
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {rightPaneTab === 'summary' ? (
                isLoadingPrevNotes ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6">
                    <Loader2 className="w-8 h-8 text-stone-300 animate-spin" />
                  </div>
                ) : aiResult ? (
                  <div className="markdown-body text-[15px] text-stone-800 leading-relaxed font-sans prose prose-stone max-w-none">
                    <ReactMarkdown>{aiResult}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-stone-200 mb-4">
                      <Sparkles className="w-8 h-8 text-stone-300" />
                    </div>
                    <h3 className="text-stone-900 font-semibold mb-2">Ready to assist</h3>
                    <p className="text-sm text-stone-500 max-w-[250px]">
                      Enter your notes on the left and I'll extract a clean summary and actionable next steps.
                    </p>
                  </div>
                )
              ) : (
                <div className="h-full flex flex-col relative w-full">
                  {!generatedDesign && !isGeneratingDesign && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                       <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-stone-200 mb-4">
                        <ImageIcon className="w-8 h-8 text-stone-300" />
                      </div>
                      <h3 className="text-stone-900 font-semibold mb-2">Ideate Designs</h3>
                      <p className="text-sm text-stone-500 max-w-[300px]">
                        Need to visualize a concept from the meeting? Type a prompt below to generate an image or mock-up.
                      </p>
                    </div>
                  )}

                  {isGeneratingDesign && (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                      <p className="text-sm font-medium text-stone-600 animate-pulse">Generating your design...</p>
                    </div>
                  )}

                  {generatedDesign && !isGeneratingDesign && (
                    <div className="flex-1 flex items-center justify-center overflow-hidden mb-4 rounded-xl border border-stone-200 bg-white p-2">
                      <img 
                        src={generatedDesign.imageUrl} 
                        alt="Generated design" 
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  )}

                  <div className="mt-auto pt-4 flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder-stone-400 text-stone-800"
                      placeholder="e.g. A sleek mobile banking app dashboard UI..."
                      value={designPrompt}
                      onChange={e => setDesignPrompt(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleGenerateDesign()}
                    />
                    <button
                      onClick={handleGenerateDesign}
                      disabled={isGeneratingDesign || !designPrompt.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
