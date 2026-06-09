import React, { useState } from 'react';
import { Download, MonitorPlay, ChevronLeft, ChevronRight, FileX } from 'lucide-react';
import pptxgen from 'pptxgenjs';

interface Slide {
  title: string;
  content: string;
  layout: 'TITLE_SLIDE' | 'CONTENT_SLIDE';
}

interface PresentationData {
  title: string;
  slides: Slide[];
}

interface SlideDeckPreviewProps {
  data: PresentationData;
}

export function SlideDeckPreview({ data }: SlideDeckPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleDownloadPptx = () => {
    try {
      const pptx = new pptxgen();
      
      data.slides.forEach((slide) => {
        let pptSlide = pptx.addSlide();
        
        if (slide.layout === 'TITLE_SLIDE') {
          pptSlide.addText(slide.title, { 
            x: 1, y: 2, w: 8, h: 1.5, 
            fontSize: 44, bold: true, color: '363636', align: 'center' 
          });
          pptSlide.addText(slide.content, { 
            x: 1, y: 3.5, w: 8, h: 1.5, 
            fontSize: 24, color: '666666', align: 'center' 
          });
        } else {
          pptSlide.addText(slide.title, { 
            x: 0.5, y: 0.5, w: 9, h: 1, 
            fontSize: 32, bold: true, color: '363636'
          });
          pptSlide.addText(slide.content, { 
            x: 0.5, y: 2, w: 9, h: 3, 
            fontSize: 20, color: '666666', align: 'left', bullet: true
          });
        }
      });
      
      pptx.writeFile({ fileName: `${data.title.replace(/\s+/g, '_')}.pptx` });
    } catch (e) {
      console.error("Failed to generate PPTX", e);
    }
  };

  if (!data || !data.slides) {
    return (
      <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl border border-red-100 my-4">
        <FileX className="w-5 h-5" />
        <span className="text-sm font-medium">Failed to parse presentation data.</span>
      </div>
    );
  }

  const slide = data.slides[currentSlide];

  return (
    <div className="my-6 border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50">
        <div className="flex items-center gap-2">
          <MonitorPlay className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-stone-800">{data.title}</span>
        </div>
        <button 
          onClick={handleDownloadPptx}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export PPTX
        </button>
      </div>
      
      <div className="relative aspect-video bg-[#F9F9F9] flex flex-col p-8 md:p-12 items-center justify-center text-center">
        {slide.layout === 'TITLE_SLIDE' ? (
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-stone-900 mb-6">{slide.title}</h2>
            <p className="text-lg md:text-xl text-stone-500">{slide.content}</p>
          </div>
        ) : (
          <div className="w-full text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-8 border-b pb-4">{slide.title}</h2>
            <div className="text-lg md:text-xl text-stone-600 space-y-4">
              {slide.content.split('\n').filter(Boolean).map((line, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2.5 shrink-0" />
                  <span>{line.replace(/^[-*]\s*/, '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-stone-100 flex items-center justify-between bg-stone-50">
        <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
          Slide {currentSlide + 1} of {data.slides.length}
        </span>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="p-1.5 text-stone-500 hover:text-stone-800 disabled:opacity-50 hover:bg-stone-200 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentSlide(Math.min(data.slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === data.slides.length - 1}
            className="p-1.5 text-stone-500 hover:text-stone-800 disabled:opacity-50 hover:bg-stone-200 rounded transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
