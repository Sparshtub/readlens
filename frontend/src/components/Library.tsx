"use client";

import { useState, useEffect } from "react";
import { useReaderStore, Document } from "@/store/readerStore";
import { api } from "@/lib/api";
import { useAppAuth } from "@/hooks/useAppAuth";
import { Upload, Trash2, BookOpen, Clock, Loader2, AlertCircle } from "lucide-react";

export default function Library() {
  const { getToken } = useAppAuth();
  const { documents, setDocuments, addDocument, removeDocument, setActiveDocument } = useReaderStore();
  const [uploading, setUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocs() {
      try {
        const token = await getToken();
        const docs = await api.getDocuments(token);
        setDocuments(docs);
      } catch (err) {
        console.error("Failed to load documents:", err);
        setError("Could not load documents from server. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    loadDocs();
  }, [setDocuments, getToken]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf")) {
      alert("Only PDF files are supported in Phase 0!");
      return;
    }

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = await getToken();
      const newDoc = await api.uploadDocument(formData, token);
      addDocument(newDoc);
    } catch (err) {
      console.error("Upload error:", err);
      setError((err as Error).message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation(); // Avoid triggering active document change
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const token = await getToken();
      await api.deleteDocument(docId, token);
      removeDocument(docId);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete: " + (err as Error).message);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-5 border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Your Library
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Upload PDF books and academic papers to begin reading.
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex gap-3 text-red-700 dark:text-red-300">
            <AlertCircle className="shrink-0" />
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}

        {/* Upload Box */}
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
          {uploading ? (
            <div className="flex flex-col items-center text-center space-y-2 py-4">
              <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
              <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">Processing PDF...</p>
              <p className="text-xs text-slate-400">Extracting metadata and preparing library node</p>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center text-center space-y-2 py-4 w-full">
              <div className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 p-4 rounded-full">
                <Upload size={24} />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Click to upload a document
              </span>
              <span className="text-xs text-slate-400">
                PDF format only
              </span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          )}
        </div>

        {/* Document Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Recent Documents</h2>
          
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center p-12 border rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400">
              <BookOpen className="mx-auto mb-3 opacity-50" size={36} />
              <p className="text-sm font-medium">No documents in your library yet.</p>
              <p className="text-xs mt-1">Upload a PDF above to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setActiveDocument(doc)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-lg">
                        <BookOpen size={20} />
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, doc.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <h3 className="mt-4 font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {doc.title}
                    </h3>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-xs text-slate-400 border-t pt-3 border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                      Read File &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
