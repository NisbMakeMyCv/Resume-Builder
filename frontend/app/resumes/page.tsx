"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MaterialIcon from "../components/MaterialIcon";
import JakeResumeBuilder from "../components/resume/JakeResumeBuilder";
import { resumesApi, getToken, type ResumeDocument } from "../../lib/api";
import { emptyResume } from "../../lib/resume";

import { decryptData } from "../../lib/crypto";
import { useCrypto } from "../providers/CryptoProvider";
import PassphraseModal from "../components/PassphraseModal";

export default function ResumesPage() {
  const { passphrase, isUnlocked } = useCrypto();
  const [editorOpen, setEditorOpen] = useState(false);
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // This state holds the raw JSON string if a user opens a saved resume
  const [selectedResumeJson, setSelectedResumeJson] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
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
    // Clear out any selected resume so it starts with the default local storage
    // or empty resume
    setSelectedResumeJson(JSON.stringify(emptyResume()));
    setEditorOpen(true);
  };

  return (
    <div className="flex-1 w-full min-h-[100vh] bg-surface relative">
      <PassphraseModal />
      <AnimatePresence mode="wait">
        {!editorOpen ? (
          <motion.div
            key="library"
            className="w-full min-h-screen py-10 px-4 sm:px-8 xl:px-16 pb-24"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-[1280px] mx-auto">
              <div className="mb-8 no-print">
                <h2 className="text-headline-md text-on-surface">My Resumes</h2>
                <p className="text-body-md text-on-surface-variant">
                  Manage, download, and track your tailored CVs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {/* 1. NEW TEMPLATE CARD (Always present) */}
                <motion.div
                  className="flex flex-col group cursor-pointer"
                  initial={{ opacity: 0, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 100, damping: 18 }}
                  onClick={handleCreateNew}
                >
                  <div className="ambient-card relative aspect-[3/4] bg-surface-container rounded-[20px] border-2 border-dashed border-outline-variant overflow-hidden flex flex-col items-center justify-center gap-4 hover:bg-surface-container-high hover:border-primary transition-all active:scale-[0.98]">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary shadow-sm border border-outline-variant group-hover:scale-110 transition-transform">
                      <MaterialIcon name="add_circle" className="text-4xl" />
                    </div>
                    <div className="text-center px-6">
                      <p className="font-bold text-on-surface">New Resume</p>
                      <p className="text-label-sm text-on-surface-variant mt-1">
                        Start from a professional template
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 px-2">
                    <p className="text-label-sm text-primary font-bold">Jake&apos;s Template</p>
                    <p className="text-label-sm text-on-surface-variant">Standard 1-column layout</p>
                  </div>
                </motion.div>

                {/* 2. SAVED RESUMES CARDS */}
                {loading ? (
                  <div className="flex items-center justify-center w-full aspect-[3/4] col-span-full sm:col-span-1">
                    <span className="text-on-surface-variant text-body-sm">Loading...</span>
                  </div>
                ) : (
                  resumes.map((doc, i) => (
                    <motion.div
                      key={doc.id}
                      className="flex flex-col group cursor-pointer"
                      initial={{ opacity: 0, y: 26 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.05, type: "spring", stiffness: 100, damping: 18 }}
                      onClick={() => handleOpenResume(doc)}
                    >
                      <div className="ambient-card relative aspect-[3/4] bg-white rounded-[20px] border border-outline-variant overflow-hidden flex flex-col hover:shadow-lg transition-all active:scale-[0.98]">
                        <div className="flex-1 bg-surface-container-lowest p-6 flex flex-col items-center justify-center relative">
                          {/* Delete button (top right) */}
                          <button
                            onClick={(e) => handleDeleteResume(e, doc.id)}
                            className="absolute top-4 right-4 text-on-surface-variant hover:text-error hover:bg-error/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                            title="Delete resume"
                          >
                            <MaterialIcon name="delete" className="text-[18px]" />
                          </button>
                          
                          <MaterialIcon name="description" className="text-6xl text-primary/40 mb-4" />
                          <div className="flex gap-2">
                            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">PDF</span>
                            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">DOCX</span>
                          </div>
                        </div>
                        <div className="p-4 border-t border-outline-variant bg-surface-container-low">
                          <p className="font-bold text-on-surface truncate">{doc.title}</p>
                          <p className="text-[11px] text-on-surface-variant mt-1">
                            Updated {new Date(doc.updated_at).toLocaleDateString()}
                          </p>
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
            className="w-full bg-surface-container-lowest"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Minimal Header for Editor */}
            <div className="h-16 border-b border-outline-variant bg-surface-container sticky top-0 z-50 flex items-center px-4 sm:px-8 xl:px-16 no-print">
              <button
                onClick={() => setEditorOpen(false)}
                className="btn-outline px-4 py-2 rounded-full text-label-sm flex items-center gap-2 hover:bg-surface-container-high"
              >
                <MaterialIcon name="arrow_back" className="text-[18px]" />
                Back to Library
              </button>
              <div className="ml-4 font-semibold text-on-surface">Jake&apos;s Resume Builder</div>
            </div>

            <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 xl:px-16 pb-24 max-w-[1920px] mx-auto">
              <JakeResumeBuilder initialDataStr={selectedResumeJson} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}