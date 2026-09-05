"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import MaterialIcon from "../components/MaterialIcon";
import JakeResumeBuilder from "../components/resume/JakeResumeBuilder";
import { resumesApi, getToken, type ResumeDocument } from "../../lib/api";
import { emptyResume } from "../../lib/resume";

import { decryptData, encryptData } from "../../lib/crypto";
import { useCrypto } from "../providers/CryptoProvider";
import PassphraseModal from "../components/PassphraseModal";
import AppSidebar from "../components/AppSidebar";
import Protected from "../components/Protected";
import { SidebarProvider, useSidebar } from "../components/SidebarContext";

export default function ResumesPage() {
  return (
    <Protected>
      <SidebarProvider>
        <ResumesInner />
      </SidebarProvider>
    </Protected>
  );
}

function ResumesInner() {
  const router = useRouter();
  const { passphrase, isUnlocked } = useCrypto();
  const [editorOpen, setEditorOpen] = useState(false);
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  /** True while we are downloading + decrypting a saved resume to open */
  const [isDownloading, setIsDownloading] = useState(false);

  // This state holds the raw JSON string if a user opens a saved resume
  const [selectedResumeJson, setSelectedResumeJson] = useState<string | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);

  // Renaming state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const { isMobileOpen, setMobileOpen } = useSidebar();

  useEffect(() => {
    fetchResumes();

    // Check if redirecting from Profile Export (U20 FIX)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("import_source") === "profile_export") {
        const exported = localStorage.getItem("makemycv_resume_jake_exported");
        const targetId = params.get("resume_id");
        if (targetId && targetId !== "new") {
          setSelectedResumeId(targetId);
        } else {
          setSelectedResumeId(undefined);
        }
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
      setSelectedResumeId(doc.id);
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

  /** B1 FIX + B2 FIX: clean rename that uses resumesApi.update() instead of raw fetch */
  const handleRenameResume = async (id: string) => {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }

    const token = getToken();
    if (!token) return;

    setRenaming(true);
    try {
      // Use the proper API helper — no hardcoded localhost URLs
      await resumesApi.rename(token, id, renameValue.trim());
      setResumes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, title: renameValue.trim() } : r))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to rename resume. Please try again.");
    } finally {
      setRenamingId(null);
      setRenaming(false);
    }
  };

  /** U21: Duplicate resume */
  const handleDuplicateResume = async (e: React.MouseEvent, doc: ResumeDocument) => {
    e.stopPropagation();
    const token = getToken();
    if (!token) return;
    try {
      const originalBlob = await resumesApi.download(token, doc.id);
      const newTitle = `${doc.title} (Copy)`;
      const newDoc = await resumesApi.create(token, newTitle, originalBlob);
      setResumes((prev) => [newDoc, ...prev]);
    } catch (err) {
      console.error(err);
      alert("Failed to duplicate resume.");
    }
  };

  const handleCreateNew = () => {
    setSelectedResumeJson(JSON.stringify(emptyResume()));
    setEditorOpen(true);
  };

  return (
    <div className="page-enter min-h-[100vh] bg-surface text-on-surface flex">
      <AppSidebar />
      <main className="flex-1 lg:ml-[var(--sidebar-width)] transition-all duration-300 relative min-h-screen">

      {/* Mobile Top Bar */}
      <div className="lg:hidden h-14 border-b border-outline-variant bg-surface flex items-center px-4 sticky top-0 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-on-surface hover:bg-surface-container rounded-full p-2 -ml-2"
        >
          <MaterialIcon name="menu" className="text-2xl" />
        </button>
        <span className="font-semibold text-label-lg ml-2">My Vault</span>
      </div>

      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-fixed/20 to-transparent pointer-events-none" />

      <PassphraseModal />

      {/* B14/U9 FIX: Show loading overlay while decrypting a resume */}
      <AnimatePresence>
        {isDownloading && (
          <motion.div
            key="decrypt-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center shadow-xl">
              <MaterialIcon name="lock_open" className="text-primary text-3xl animate-pulse" />
            </div>
            <p className="text-label-md font-semibold text-on-surface">Decrypting resume…</p>
            <p className="text-label-sm text-on-surface-variant">This only takes a moment</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!editorOpen ? (
          <motion.div
            key="library"
            className="w-full min-h-screen py-8 lg:py-12 px-6 sm:px-10 xl:px-20 pb-24 relative z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="max-w-[1400px] mx-auto">
              {/* Header Section */}
              <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200/60 pb-6 no-print">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-primary">
                  <MaterialIcon name="folder_open" className="text-4xl" />
                  <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                    My Vault
                  </h2>
                </div>
                <p className="text-lg text-on-surface-variant max-w-xl">
                  Manage, duplicate, and edit your tailored resumes securely.
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
                      onClick={() => renamingId !== doc.id && handleOpenResume(doc)}
                    >
                      {/* B1 FIX: Properly structured card with non-overlapping rename UI */}
                      <div className="relative aspect-[3/4] bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.98]">

                        {/* Encrypted badge */}
                        <div className="absolute top-4 left-4 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-green-500/20 z-10 shadow-sm">
                          <MaterialIcon name="lock" className="text-[12px]" />
                          Encrypted
                        </div>

                        {/* Action buttons (top-right) */}
                        <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
                          <button
                            className="text-on-surface-variant hover:text-primary bg-surface-container-lowest hover:bg-primary/10 rounded-full p-2 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                            title="Duplicate Resume"
                            onClick={(e) => handleDuplicateResume(e, doc)}
                          >
                            <MaterialIcon name="content_copy" className="text-[18px]" />
                          </button>
                          <button
                            className="text-on-surface-variant hover:text-primary bg-surface-container-lowest hover:bg-primary/10 rounded-full p-2 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                            title="Rename Resume"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingId(doc.id);
                              setRenameValue(doc.title);
                            }}
                          >
                            <MaterialIcon name="edit" className="text-[18px]" />
                          </button>
                          <button
                            className="text-on-surface-variant hover:text-error bg-surface-container-lowest hover:bg-error-container/50 rounded-full p-2 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                            title="Delete Resume"
                            onClick={(e) => handleDeleteResume(e, doc.id)}
                          >
                            <MaterialIcon name="delete" className="text-[18px]" />
                          </button>
                        </div>

                        {/* U2 FIX: Miniature SVG Jake Resume visual thumbnail */}
                        <div className="absolute inset-x-6 top-14 bottom-28 rounded-xl bg-surface-container-low/50 border border-outline-variant/30 p-3 overflow-hidden opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none flex flex-col gap-1.5">
                          <div className="w-1/2 h-2 bg-primary/40 rounded mx-auto" />
                          <div className="w-1/3 h-1 bg-on-surface-variant/30 rounded mx-auto mb-1" />
                          <div className="h-[1px] bg-outline-variant/40 w-full mb-1" />
                          <div className="w-1/4 h-1.5 bg-primary/30 rounded" />
                          <div className="w-full h-1 bg-on-surface-variant/20 rounded" />
                          <div className="w-5/6 h-1 bg-on-surface-variant/20 rounded" />
                          <div className="w-1/4 h-1.5 bg-primary/30 rounded mt-1" />
                          <div className="w-full h-1 bg-on-surface-variant/20 rounded" />
                          <div className="w-4/5 h-1 bg-on-surface-variant/20 rounded" />
                        </div>

                        {/* Card body */}
                        <div className="flex-1 flex flex-col justify-end p-6 pt-16 z-10">
                          {/* Doc icon */}
                          <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center mb-4">
                            <MaterialIcon name="description" className="text-2xl" filled />
                          </div>

                          {/* B1 FIX: rename input OR title — never both at once */}
                          {renamingId === doc.id ? (
                            <div
                              className="space-y-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRenameResume(doc.id);
                                    if (e.key === "Escape") setRenamingId(null);
                                  }}
                                  className="flex-1 min-w-0 bg-surface-container px-3 py-1.5 rounded-lg border border-primary focus:outline-none text-label-md"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleRenameResume(doc.id)}
                                  disabled={renaming}
                                  className="text-primary hover:bg-primary-fixed p-1.5 rounded-full shrink-0 disabled:opacity-50"
                                >
                                  {renaming
                                    ? <MaterialIcon name="sync" className="text-[18px] animate-spin" />
                                    : <MaterialIcon name="check" className="text-[18px]" />
                                  }
                                </button>
                                <button
                                  onClick={() => setRenamingId(null)}
                                  className="text-on-surface-variant hover:text-error p-1.5 rounded-full shrink-0"
                                >
                                  <MaterialIcon name="close" className="text-[18px]" />
                                </button>
                              </div>
                              <p className="text-label-sm text-on-surface-variant">Press Enter to save</p>
                            </div>
                          ) : (
                            <>
                              <p className="font-bold text-on-surface truncate text-lg">{doc.title}</p>
                              <div className="flex items-center gap-1.5 mt-2 text-on-surface-variant">
                                <MaterialIcon name="schedule" className="text-[14px]" />
                                <p className="text-xs">
                                  {new Date(doc.updated_at).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                              <div className="mt-3 flex items-center gap-1.5 text-secondary text-label-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                <MaterialIcon name="open_in_new" className="text-[14px]" />
                                Open &amp; Edit
                              </div>
                            </>
                          )}
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
            <div className="w-full min-h-screen pb-24 mx-auto bg-surface relative z-10">
              <JakeResumeBuilder resumeId={selectedResumeId} initialDataStr={selectedResumeJson} onClose={() => setEditorOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}