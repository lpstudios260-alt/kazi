import React, { useState, useEffect } from 'react';
import { X, Search, File, AlertCircle, Loader2 } from 'lucide-react';
import { googleSignIn, getAccessToken } from '../lib/firebase';
import { ChatAttachment } from '../types';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

interface DrivePickerModalProps {
  onClose: () => void;
  onSelect: (files: ChatAttachment[]) => void;
}

export function DrivePickerModal({ onClose, onSelect }: DrivePickerModalProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const fetchFiles = async (token: string, query: string = '') => {
    try {
      setLoading(true);
      const q = query ? `name contains '${query}' and trashed = false` : `trashed = false`;
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType)&pageSize=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
         if (response.status === 401 || response.status === 403) {
            throw new Error("unauthorized");
         }
         throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      setFiles(data.files || []);
      setError(null);
    } catch (err: any) {
      if (err.message === "unauthorized") {
         setError("unauthorized");
      } else {
         setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      let token = await getAccessToken();
      if (!token) {
        setError('unauthorized');
        setLoading(false);
        return;
      }
      fetchFiles(token);
    };
    initialize();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getAccessToken();
    if (token) {
      fetchFiles(token, searchQuery);
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await googleSignIn();
      if (result) {
        fetchFiles(result.accessToken);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  const toggleFileSelection = (id: string) => {
    const newSelection = new Set(selectedFileIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedFileIds(newSelection);
  };

  const handleConfirm = async () => {
    if (selectedFileIds.size === 0) return;
    setDownloading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      const selectedFiles = files.filter(f => selectedFileIds.has(f.id));
      const attachments: ChatAttachment[] = [];

      for (const file of selectedFiles) {
        // Download the file content
        // If it's a google workspace document (docs, sheets, slides), we need to export it
        let url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
        let mimeType = file.mimeType;

        if (file.mimeType === 'application/vnd.google-apps.document') {
           mimeType = 'application/pdf';
           url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=application/pdf`;
        } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
           mimeType = 'application/pdf';
           url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=application/pdf`;
        } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
           mimeType = 'application/pdf';
           url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=application/pdf`;
        }

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
           console.error("Failed to download file", file.name, await response.text());
           continue; // Skip failed files
        }

        const blob = await response.blob();
        
        // Read file as base64
        const base64data = await new Promise<string>((resolve, reject) => {
           const reader = new FileReader();
           reader.onloadend = () => {
             const result = reader.result as string;
             resolve(result.split(',')[1]); // remove data URL prefix
           };
           reader.onerror = reject;
           reader.readAsDataURL(blob);
        });

        attachments.push({
           name: file.name,
           mimeType: mimeType,
           data: base64data
        });
      }

      onSelect(attachments);
      onClose();
    } catch (err: any) {
      setError("Failed to download selected files: " + (err.message || err.toString()));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <svg viewBox="0 0 48 48" className="w-5 h-5">
               <path fill="#FFC107" d="M17 5.865l13.6 23.556-9.697 16.795L7.303 22.66z"></path>
               <path fill="#1976D2" d="M31.003 30.147H9.255L-1.6 11.332h21.748z"></path>
               <path fill="#4CAF50" d="M40.231 46.216H18.483L29.34 27.401h21.748z"></path>
            </svg>
            Select from Google Drive
          </h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error === 'unauthorized' ? (
          <div className="p-12 flex flex-col items-center justify-center">
             <div className="w-16 h-16 bg-blue-50 rounded-full flex flex-col items-center justify-center mb-4 text-blue-500">
                <svg viewBox="0 0 48 48" className="w-8 h-8">
                   <path fill="#FFC107" d="M17 5.865l13.6 23.556-9.697 16.795L7.303 22.66z"></path>
                   <path fill="#1976D2" d="M31.003 30.147H9.255L-1.6 11.332h21.748z"></path>
                   <path fill="#4CAF50" d="M40.231 46.216H18.483L29.34 27.401h21.748z"></path>
                </svg>
             </div>
             <h3 className="text-xl font-bold text-stone-800 mb-2">Connect Google Drive</h3>
             <p className="text-stone-500 text-center mb-6 max-w-sm">
               Connect your Google Drive account to browse and attach files directly to the chat.
             </p>
             <button onClick={handleSignIn} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-full transition-colors flex items-center gap-2">
               Sign in with Google
             </button>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b border-stone-100 bg-stone-50/50">
              <form onSubmit={handleSearch} className="relative">
                <Search className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search in Drive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-4 p-4 min-h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : error ? (
                <div className="flex items-start gap-3 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-stone-400">
                  <File className="w-12 h-12 mb-3 opacity-20" />
                  <p>No files found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {files.map(file => {
                    const isSelected = selectedFileIds.has(file.id);
                    return (
                      <div
                        key={file.id}
                        onClick={() => toggleFileSelection(file.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-stone-300'}`}>
                           {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <File className="w-5 h-5 text-stone-400 shrink-0" />
                        <span className="text-sm text-stone-700 font-medium truncate">{file.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedFileIds.size > 0 && (
               <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-600">{selectedFileIds.size} file(s) selected</span>
                  <button 
                    onClick={handleConfirm}
                    disabled={downloading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-full transition-colors flex items-center gap-2"
                  >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {downloading ? "Downloading..." : "Add to chat"}
                  </button>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
