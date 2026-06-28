import { create } from "zustand";

export interface Document {
  id: string;
  title: string;
  file_url: string;
  created_at: string;
}

export interface Highlight {
  id: string;
  document_id: string;
  text: string;
  page_index: number;
  selection_coords?: string;
  explanation?: string;
  translation?: string;
}

interface ReaderState {
  documents: Document[];
  activeDocument: Document | null;
  currentPage: number;
  numPages: number;
  highlights: Highlight[];
  theme: "light" | "dark" | "sepia";
  sidebarOpen: boolean;
  
  setDocuments: (docs: Document[]) => void;
  addDocument: (doc: Document) => void;
  removeDocument: (docId: string) => void;
  setActiveDocument: (doc: Document | null) => void;
  setCurrentPage: (page: number) => void;
  setNumPages: (num: number) => void;
  setHighlights: (highlights: Highlight[]) => void;
  addHighlight: (highlight: Highlight) => void;
  removeHighlight: (id: string) => void;
  setTheme: (theme: "light" | "dark" | "sepia") => void;
  toggleSidebar: () => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  documents: [],
  activeDocument: null,
  currentPage: 1,
  numPages: 0,
  highlights: [],
  theme: "light",
  sidebarOpen: true,

  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) => set((state) => ({ documents: [doc, ...state.documents] })),
  removeDocument: (docId) => set((state) => ({
    documents: state.documents.filter((d) => d.id !== docId),
    activeDocument: state.activeDocument?.id === docId ? null : state.activeDocument
  })),
  setActiveDocument: (doc) => set({ activeDocument: doc, currentPage: 1, numPages: 0 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setNumPages: (num) => set({ numPages: num }),
  setHighlights: (highlights) => set({ highlights }),
  addHighlight: (hl) => set((state) => ({ highlights: [...state.highlights, hl] })),
  removeHighlight: (id) => set((state) => ({
    highlights: state.highlights.filter((h) => h.id !== id)
  })),
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
