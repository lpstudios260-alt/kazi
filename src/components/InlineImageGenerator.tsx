import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, ImageIcon, CloudUpload, CheckCircle2 } from 'lucide-react';
import { getAccessToken } from '../lib/firebase';

interface InlineImageGeneratorProps {
  prompt: string;
}

export function InlineImageGenerator({ prompt }: InlineImageGeneratorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    let isMounted = true;
    
    const generateImage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSaveStatus('idle');
        
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate image');
        }

        const data = await res.json();
        if (!isMounted) return;
        
        setImageUrl(data.imageBase64);
        
        // Auto-save logic
        setIsSaving(true);
        try {
          const token = await getAccessToken();
          if (!token) {
            setIsSaving(false);
            return; // No token, no auto-save
          }
          
          const titleSummary = prompt.slice(0, 20).replace(/[^a-z0-9]/gi, '_');
          
          const exportRes = await fetch('/api/drive/export', {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ 
              type: "image", 
              content: data.rawBase64, 
              filename: `Generated_Design_${titleSummary}.png`, 
              mimeType: data.mimeType 
            }),
          });
          
          if (!exportRes.ok) {
            const errData = await exportRes.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to export");
          }
          if (isMounted) setSaveStatus('success');
        } catch (saveError) {
          // Suppress error log
          if (isMounted) setSaveStatus('error');
        } finally {
          if (isMounted) setIsSaving(false);
        }

      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Image generation failed');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    generateImage();

    return () => {
      isMounted = false;
    };
  }, [prompt]);

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-stone-100 rounded-xl border border-stone-200 flex flex-col items-center justify-center text-stone-500 mt-4 mb-2">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-stone-400" />
        <span className="text-sm font-medium">Generating your design...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 text-red-600 rounded-xl border border-red-100 p-4 flex items-start gap-3 mt-4 mb-2">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm">Failed to generate design</h4>
          <p className="text-sm opacity-90 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!imageUrl) return null;

  return (
    <div className="w-full mt-4 mb-2 overflow-hidden rounded-xl border border-stone-200 shadow-sm bg-stone-50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-stone-200 bg-white">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-stone-400" />
          <span className="text-xs font-semibold text-stone-600 uppercase tracking-widest">Generated Visual</span>
        </div>
        <div className="flex items-center gap-1.5 border border-stone-200 px-2 py-1 rounded bg-stone-50">
          {isSaving ? (
             <>
               <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-500" />
               <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">Auto-Saving...</span>
             </>
          ) : saveStatus === 'success' ? (
             <>
               <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
               <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">Saved to Drive</span>
             </>
          ) : saveStatus === 'error' ? (
             <>
               <AlertCircle className="w-3.5 h-3.5 text-red-500" />
               <span className="text-[10px] uppercase font-bold tracking-wider text-red-600">Save Failed</span>
             </>
          ) : null}
        </div>
      </div>
      <div className="p-4 flex justify-center bg-[#f8f9fa] backdrop-blur-sm relative generator-checkered-bg">
        <img 
          src={imageUrl} 
          alt={prompt}
          referrerPolicy="no-referrer"
          className="max-w-full h-auto max-h-[500px] object-contain shadow-md rounded border border-stone-200"
        />
      </div>
      <div className="px-4 py-3 bg-white border-t border-stone-200">
        <p className="text-[11px] text-stone-500 line-clamp-2" title={prompt}>
           <strong>Prompt details:</strong> {prompt}
        </p>
      </div>
      <style>{`
        .generator-checkered-bg {
          background-image: linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
}
