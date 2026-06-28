import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useReaderStore } from "@/store/readerStore";
import { api } from "@/lib/api";
import { useAppAuth } from "@/hooks/useAppAuth";
import ChatPanel from "@/components/ChatPanel";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Loader2, 
  Sparkles, 
  Languages, 
  Highlighter,
  Bot
} from "lucide-react";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

interface SelectionData {
  text: string;
  coords: { x: number; y: number };
}

export default function Reader() {
  const { getToken } = useAppAuth();
  const { 
    activeDocument, 
    currentPage, 
    setCurrentPage, 
    numPages, 
    setNumPages, 
    highlights,
    addHighlight, 
    theme 
  } = useReaderStore();

  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [selection, setSelection] = useState<SelectionData | null>(null);
  const [creatingHighlight, setCreatingHighlight] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"companion" | "highlights">("companion");
  const containerRef = useRef<HTMLDivElement>(null);

  // Monitor text selection
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelection(null);
      return;
    }

    const text = sel.toString().trim();
    
    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      
      if (containerRect) {
        // Position popover relative to selection
        const x = rect.left - containerRect.left + (rect.width / 2);
        const y = rect.top - containerRect.top - 45 + (containerRef.current?.scrollTop || 0);
        
        setSelection({
          text,
          coords: { x, y }
        });
      }
    } catch (e) {
      console.error("Failed to calculate selection coordinates", e);
    }
  };

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const triggerHighlight = async () => {
    if (!selection || !activeDocument) return;
    setCreatingHighlight(true);
    
    try {
      const token = await getToken();
      
      const selectionCoordsJson = JSON.stringify({
        x: selection.coords.x,
        y: selection.coords.y
      });

      const newHl = await api.createHighlight({
        document_id: activeDocument.id,
        text: selection.text,
        page_index: currentPage,
        selection_coords: selectionCoordsJson
      }, token);

      addHighlight(newHl);
      
      // Clear selection
      window.getSelection()?.removeAllRanges();
      setSelection(null);
      
      // Switch tab to highlights to show explanation & translation
      setActiveTab("highlights");
    } catch (error) {
      console.error("Failed to create highlight", error);
      alert("Failed to save highlight: " + (error as Error).message);
    } finally {
      setCreatingHighlight(false);
    }
  };

  const changePage = (offset: number) => {
    setCurrentPage(Math.max(1, Math.min(numPages, currentPage + offset)));
    setSelection(null);
  };

  // Analytics Heartbeat recording
  useEffect(() => {
    if (!activeDocument) return;
    
    // Send reading heartbeat every 15 seconds
    const interval = setInterval(async () => {
      try {
        const token = await getToken();
        await api.sendHeartbeat(15, token);
      } catch (err) {
        console.error("Failed to send reading heartbeat", err);
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [activeDocument, getToken]);

  useEffect(() => {
    setLoading(true);
    setSelection(null);
  }, [activeDocument]);

  if (!activeDocument) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500">
        <p className="text-lg">Select a document from the library to start reading.</p>
      </div>
    );
  }

  // Filter highlights on this page
  const pageHighlights = highlights.filter(
    (h) => h.document_id === activeDocument.id && h.page_index === currentPage
  );

  // Define background/text classes based on theme
  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return "bg-slate-900 text-slate-100 border-slate-800";
      case "sepia":
        return "bg-[#f4ecd8] text-[#5b4636] border-[#e4dcc4]";
      default:
        return "bg-white text-slate-900 border-slate-200";
    }
  };

  const fileUrl = activeDocument.file_url.startsWith("http") 
    ? activeDocument.file_url 
    : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || ""}${activeDocument.file_url}`;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Reader Controls Toolbar */}
      <div className="h-12 border-b flex items-center justify-between px-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 z-10">
        <h2 className="text-sm font-semibold truncate max-w-xs sm:max-w-md text-slate-700 dark:text-slate-200">
          {activeDocument.title}
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => changePage(-1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Page {currentPage} of {numPages || "?"}
            </span>
            <button
              onClick={() => changePage(1)}
              disabled={currentPage >= numPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setScale(prev => Math.max(0.6, prev - 0.1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs text-slate-600 dark:text-slate-300 w-10 text-center font-medium">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(prev => Math.min(2.0, prev + 0.1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-row overflow-hidden min-h-0 w-full">
        {/* PDF Reader Canvas Area */}
        <div 
          ref={containerRef}
          onMouseUp={handleMouseUp}
          className="flex-1 overflow-auto p-8 flex justify-center relative focus:outline-none scroll-smooth min-w-0"
        >
          {/* Selection Popover */}
          {selection && (
            <div 
              style={{ 
                position: "absolute",
                left: `${selection.coords.x}px`,
                top: `${selection.coords.y}px`,
                transform: "translateX(-50%)"
              }}
              className="flex items-center bg-slate-900 dark:bg-slate-800 text-white rounded-lg shadow-xl py-1 px-1.5 border border-slate-700/50 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150 gap-1"
            >
              <button
                onClick={triggerHighlight}
                disabled={creatingHighlight}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors text-indigo-400"
              >
                {creatingHighlight ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Highlighter size={13} />
                )}
                Highlight
              </button>
              <div className="w-px h-4 bg-slate-700" />
              <span className="text-[10px] text-slate-400 px-1 truncate max-w-[120px]">
                "{selection.text.substring(0, 15)}..."
              </span>
            </div>
          )}

          <div className={`shadow-lg border rounded-sm p-4 transition-colors ${getThemeClasses()} self-start`}>
            {loading && (
              <div className="flex flex-col items-center justify-center p-20 min-h-[400px] w-[600px]">
                <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
                <p className="text-sm text-slate-500">Loading document...</p>
              </div>
            )}
            
            <Document
              file={fileUrl}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={(err) => {
                console.error("PDF loading error:", err);
                setLoading(false);
              }}
              loading={null}
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderAnnotationLayer={false}
                renderTextLayer={true}
                className="mx-auto"
                loading={null}
              />
            </Document>
          </div>
        </div>

        {/* Right Companion Panel */}
        <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 h-full overflow-hidden">
          {/* Tab Selector Header */}
          <div className="h-10 flex border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider shrink-0 bg-slate-50 dark:bg-slate-900">
            <button
              onClick={() => setActiveTab("companion")}
              className={`flex-1 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === "companion"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-350"
              }`}
            >
              <Bot size={13} /> AI Companion
            </button>
            <button
              onClick={() => setActiveTab("highlights")}
              className={`flex-1 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === "highlights"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-350"
              }`}
            >
              <Highlighter size={13} /> Highlights
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-hidden min-h-0">
            {activeTab === "companion" ? (
              <ChatPanel documentId={activeDocument.id} currentPage={currentPage} />
            ) : (
              /* Highlights list for current page */
              <div className="h-full overflow-y-auto p-4 space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Page {currentPage} Highlights
                </h3>
                {pageHighlights.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                    <Highlighter className="mx-auto mb-2 opacity-30 text-slate-400" size={24} />
                    <p className="text-xs">No highlights on this page.</p>
                    <p className="text-[10px] mt-0.5 text-slate-400">Select text to save a highlight</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pageHighlights.map((hl) => (
                      <div 
                        key={hl.id} 
                        className="border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/40 p-3 rounded-xl space-y-2 text-xs"
                      >
                        <blockquote className="italic border-l-2 border-indigo-500 pl-2 text-slate-700 dark:text-slate-300 font-medium">
                          "{hl.text}"
                        </blockquote>
                        
                        {hl.explanation && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 bg-white dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100/50 dark:border-slate-800/40 leading-relaxed shadow-sm">
                            <strong className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5 uppercase tracking-wider">
                              Simple Explanation:
                            </strong>
                            {hl.explanation}
                          </div>
                        )}
                        
                        {hl.translation && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100/50 dark:border-slate-800/40 leading-relaxed shadow-sm">
                            <strong className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5 uppercase tracking-wider">
                              Hindi Translation:
                            </strong>
                            {hl.translation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
