"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import MaterialIcon from "../components/MaterialIcon";
import JakeResumeBuilder from "../components/resume/JakeResumeBuilder";
import { resumesApi, getToken, type ResumeDocument } from "../../lib/api";
import { emptyResume } from "../../lib/resume";

import { decryptData } from "../../lib/crypto";
import { useCrypto } from "../providers/CryptoProvider";
import PassphraseModal from "../components/PassphraseModal";

export default function ResumesPage() {
  const router = useRouter();
  const { passphrase, isUnlocked } = useCrypto();
  const [editorOpen, setEditorOpen] = useState(false);
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // This state holds the raw JSON string if a user opens a saved resume
  const [selectedResumeJson, setSelectedResumeJson] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
    
    // Check if redirecting from Profile Export
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("import_source") === "profile_export") {
        const exported = localStorage.getItem("makemycv_resume_jake_exported");
        if (exported) {
          setSelectedResumeJson(exported);
          setEditorOpen(true);
          // Clean URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, []);

  const fetchResumes = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await resumesApi.list(token);
      setResumes(data || []);
    } catch (err) {
      console.error("Failed to fetch resumes", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResume = async (doc: ResumeDocument) => {
    if (!passphrase) {
      alert("Encryption passphrase is required to decrypt this resume.");
      return;
    }
    const token = getToken();
    if (!token) return;

    setIsDownloading(true);
    try {
      const blob = await resumesApi.download(token, doc.id);
      const jsonString = await decryptData(blob, passphrase);
      setSelectedResumeJson(jsonString);
      setEditorOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to decrypt resume. Did you enter the correct passphrase?");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteResume = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this saved resume?")) return;
    
    const token = getToken();
    if (!token) return;
    
    try {
      await resumesApi.remove(token, id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert("Failed to delete resume.");
    }
  };

  const handleCreateNew = () => {
    setSelectedResumeJson(JSON.stringify(emptyResume()));
    setEditorOpen(true);
  };

  return (
    <div className="flex-1 w-full min-h-[100vh] bg-[#f8fafc] relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-blue-400/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[50%] rounded-full bg-indigo-400/5 blur-[100px] pointer-events-none" />

      <PassphraseModal />
      <AnimatePresence mode="wait">
        {!editorOpen ? (
          <motion.div
            key="library"
            className="w-full min-h-screen py-12 px-6 sm:px-10 xl:px-20 pb-24 relative z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="max-w-[1400px] mx-auto">
              {/* Header Section */}
              <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200/60 pb-6 no-print">
                <div>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-2 cursor-pointer"
                  >
                    <MaterialIcon name="arrow_back" className="text-[18px]" />
                    Back to Dashboard
                  </button>
                  <h2 className="text-4xl font-extrabold text-on-surface tracking-tight">My Vault</h2>
                  <p className="text-on-surface-variant mt-2 text-lg">
                    Manage, decrypt, and edit your zero-knowledge resumes.
                  </p>
                </div>
                <button
                  onClick={fetchResumes}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-lowest border border-outline-variant text-on-surface font-medium rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <MaterialIcon name="sync" className={`text-xl ${loading ? 'animate-spin text-primary' : ''}`} />
                  {loading ? 'Syncing...' : 'Refresh'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {/* 1. NEW TEMPLATE CARD */}
                <motion.div
                  className="flex flex-col group cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
                  onClick={handleCreateNew}
                >
                  <div className="relative aspect-[3/4] bg-surface-container-lowest backdrop-blur-md rounded-3xl border-2 border-dashed border-outline-variant overflow-hidden flex flex-col items-center justify-center gap-5 hover:bg-surface-container-low hover:border-primary hover:shadow-2xl transition-all duration-300 active:scale-[0.98]">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-sm border border-primary/20 group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
                      <MaterialIcon name="add" className="text-4xl" />
                    </div>
                    <div className="text-center px-6">
                      <p className="font-bold text-on-surface text-lg">New Document</p>
                      <p className="text-sm text-on-surface-variant mt-1">
                        Start from a blank template
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* 2. SAVED RESUMES CARDS */}
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-surface-container-low rounded-3xl border border-outline-variant animate-pulse" />
                  ))
                ) : (
                  resumes.map((doc, i) => (
                    <motion.div
                      key={doc.id}
                      className="flex flex-col group cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + (i+1) * 0.05, type: "spring", stiffness: 100, damping: 15 }}
                      onClick={() => handleOpenResume(doc)}
                    >
                      <div className="relative aspect-[3/4] bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.98]">
                        
                        {/* Cloud Lock Indicator */}
                        <div className="absolute top-4 left-4 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-green-500/20 z-10 shadow-sm">
                          <MaterialIcon name="lock" className="text-[12px]" />
                          Encrypted
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDeleteResume(e, doc.id)}
                          className="absolute top-3 right-3 text-on-surface-variant hover:text-error hover:bg-error-container w-9 h-9 rounded-full flex items-center justify-center transition-colors z-10 opacity-0 group-hover:opacity-100"
                          title="Delete resume"
                        >
                          <MaterialIcon name="delete" className="text-[20px]" />
                        </button>
                        
                        <div className="flex-1 bg-surface-container-low p-6 flex flex-col items-center justify-center relative border-b border-outline-variant">
                          <div className="w-20 h-24 bg-surface-container-lowest shadow-md border border-outline-variant rounded-md flex flex-col items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
                             <div className="w-12 h-2 bg-primary/20 rounded-full mb-2 absolute top-4 left-3" />
                             <div className="w-14 h-2 bg-on-surface-variant/20 rounded-full mb-2 absolute top-8 left-3" />
                             <div className="w-10 h-2 bg-on-surface-variant/20 rounded-full mb-2 absolute top-12 left-3" />
                             <MaterialIcon name="description" className="text-4xl text-primary/30 absolute bottom-3 right-3" />
                          </div>
                        </div>
                        
                        <div className="p-5 bg-surface-container-lowest">
                          <p className="font-bold text-on-surface truncate text-lg">{doc.title}</p>
                          <div className="flex items-center gap-1.5 mt-2 text-on-surface-variant">
                            <MaterialIcon name="schedule" className="text-[14px]" />
                            <p className="text-xs">
                              {new Date(doc.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            className="w-full bg-surface-container-lowest relative z-20"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Minimal Header for Editor */}
            <div className="h-16 border-b border-outline-variant bg-surface-container-lowest shadow-sm sticky top-0 z-50 flex items-center px-4 sm:px-8 xl:px-16 no-print">
              <button
                onClick={() => setEditorOpen(false)}
                className="btn-outline px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
              >
                <MaterialIcon name="arrow_back" className="text-[18px]" />
                Save & Close
              </button>
              <div className="ml-4 font-bold text-on-surface tracking-tight">MakeMyCV Builder</div>
            </div>

            <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 xl:px-16 pb-24 max-w-[1920px] mx-auto bg-surface">
              <JakeResumeBuilder initialDataStr={selectedResumeJson} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}