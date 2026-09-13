"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import MaterialIcon from "../components/MaterialIcon";
import JakeResumeBuilder from "../components/resume/JakeResumeBuilder";
import JakeResumePreview from "../components/resume/JakeResumePreview";
import { resumesApi, getToken, type ResumeDocument } from "../../lib/api";
import { emptyResume, type ResumeData } from "../../lib/resume";

import { decryptData } from "../../lib/crypto";
import { useCrypto } from "../providers/CryptoProvider";
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
  const { open } = useSidebar();
  const { passphrase, isLoading: cryptoLoading } = useCrypto();
  const [editorOpen, setEditorOpen] = useState(false);
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  /** True while we are downloading + decrypting a saved resume to open */
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // This state holds the raw JSON string if a user opens a saved resume
  const [selectedResumeJson, setSelectedResumeJson] = useState<string | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);

  // Renaming state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Resume previews cache for real half-body card thumbnails
  const [previews, setPreviews] = useState<Record<string, ResumeData>>({});

  useEffect(() => {
    if (resumes.length > 0) {
      loadPreviews(resumes);
    }
  }, [resumes]);

  const loadPreviews = async (docs: ResumeDocument[]) => {
    const token = getToken();
    if (!token) return;

    for (const doc of docs) {
      if (previews[doc.id]) continue;
      try {
        const blob = await resumesApi.download(token, doc.id);
        let dataStr = await blob.text();
        if (!dataStr.trim().startsWith("{") && !dataStr.trim().startsWith("[")) {
          try {
            dataStr = await decryptData(blob, passphrase || "");
          } catch {
            // fallback
          }
        }
        const parsed: ResumeData = JSON.parse(dataStr);
        setPreviews((prev) => ({ ...prev, [doc.id]: parsed }));
      } catch (err) {
        // Silently skip if thumbnail cannot be generated
      }
    }
  };

  useEffect(() => {
    fetchResumes();

    // Check URL parameters for active resume state or Profile Export
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get("id");

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
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (urlId) {
        if (urlId === "new") {
          setSelectedResumeJson(JSON.stringify(emptyResume()));
          setSelectedResumeId(undefined);
          setEditorOpen(true);
        } else {
          // Load resume by URL id
          loadResumeById(urlId);
        }
      }
    }
  }, []);

  const loadResumeById = async (id: string) => {
    const token = getToken();
    if (!token) return;

    setIsDownloading(true);
    setDownloadError(null);
    try {
      const blob = await resumesApi.download(token, id);
      let jsonString = await blob.text();
      if (!jsonString.trim().startsWith("{") && !jsonString.trim().startsWith("[")) {
        try {
          jsonString = await decryptData(blob, passphrase || "");
        } catch {
          // fallback
        }
      }
      setSelectedResumeId(id);
      setSelectedResumeJson(jsonString);
      setEditorOpen(true);
    } catch (err) {
      console.error(err);
      setDownloadError("Failed to load resume. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

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
    } catch {
      setResumes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResume = async (doc: ResumeDocument) => {
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `?id=${doc.id}`);
    }
    await loadResumeById(doc.id);
  };

  const handleDeleteResume = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this saved resume?")) return;

    const token = getToken();
    if (!token) return;

    try {
      await resumesApi.remove(token, id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
      if (selectedResumeId === id) {
        setEditorOpen(false);
        if (typeof window !== "undefined") {
          window.history.pushState(null, "", window.location.pathname);
        }
      }
    } catch (err) {
      alert("Failed to delete resume.");
    }
  };

  const handleRenameResume = async (id: string) => {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }

    const token = getToken();
    if (!token) return;

    setRenaming(true);
    try {
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
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "?id=new");
    }
    setSelectedResumeJson(JSON.stringify(emptyResume()));
    setSelectedResumeId(undefined);
    setEditorOpen(true);
  };

  return (
    <div className="page-enter min-h-[100vh] bg-surface text-on-surface flex">
      <AppSidebar />
      <main className="flex-1 lg:ml-[var(--sidebar-width)] transition-all duration-300 relative min-h-screen">

      {/* Mobile Top Bar */}
      <div className="lg:hidden h-14 navbar-glass flex items-center px-4 sticky top-0 z-40 no-print">
        <button
          onClick={open}
          className="text-on-surface hover:bg-surface-container rounded-full p-2 -ml-2"
        >
          <MaterialIcon name="menu" className="text-2xl" />
        </button>
        <span className="font-semibold text-label-lg ml-2">My Vault</span>
      </div>

      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-fixed/20 to-transparent pointer-events-none no-print" />

      {/* Download / Decrypt status overlay */}
      <AnimatePresence>
        {isDownloading && (
          <motion.div
            key="decrypt-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 no-print"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center shadow-xl">
              <MaterialIcon name="lock_open" className="text-primary text-3xl animate-pulse" />
            </div>
            <p className="text-label-md font-semibold text-on-surface">Opening resume…</p>
            <p className="text-label-sm text-on-surface-variant">This only takes a moment</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast for download/decrypt failure */}
      <AnimatePresence>
        {downloadError && (
          <motion.div
            key="download-error"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-error text-on-error rounded-2xl shadow-2xl px-6 py-4 flex items-start gap-3 max-w-md w-full mx-4 no-print"
          >
            <MaterialIcon name="error" className="text-[22px] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-label-md font-semibold">Could not open resume</p>
              <p className="text-label-sm mt-1 opacity-90">{downloadError}</p>
            </div>
            <button
              onClick={() => setDownloadError(null)}
              className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <MaterialIcon name="close" className="text-[18px]" />
            </button>
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
              <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant pb-6 no-print">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-primary">
                  <MaterialIcon name="folder_open" className="text-4xl" />
                  <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-on-surface">
                    My Vault
                  </h2>
                </div>
                <p className="text-lg text-on-surface-variant max-w-xl">
                  Manage, duplicate, and edit your tailored resumes. All saved securely & encrypted.
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
                  <div className="relative h-[360px] bg-surface-container-lowest backdrop-blur-md rounded-3xl border-2 border-dashed border-outline-variant overflow-hidden flex flex-col items-center justify-center gap-5 hover:bg-surface-container-low hover:border-primary hover:shadow-2xl transition-all duration-300 active:scale-[0.98]">
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
                    <div key={i} className="h-[360px] bg-surface-container-low rounded-3xl border border-outline-variant animate-pulse" />
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
                      {/* Card */}
                      <div className="relative h-[360px] bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.98]">
                        
                        {/* Header Bar: Badge on Left, Actions on Right */}
                        <div className="px-4 pt-3.5 pb-2 flex items-center justify-between gap-2 shrink-0 z-20">
                          <div className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 shrink-0">
                            <MaterialIcon name="description" className="text-[12px]" />
                            <span>Resume</span>
                          </div>

                          <div className="flex items-center gap-0.5 bg-surface-container-low/90 backdrop-blur-md px-1.5 py-1 rounded-full border border-outline-variant/50 shadow-xs">
                            <button
                              className="text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-full p-1.5 transition-all"
                              title="Duplicate Resume"
                              onClick={(e) => handleDuplicateResume(e, doc)}
                            >
                              <MaterialIcon name="content_copy" className="text-[16px]" />
                            </button>
                            <button
                              className="text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-full p-1.5 transition-all"
                              title="Rename Resume"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingId(doc.id);
                                setRenameValue(doc.title);
                              }}
                            >
                              <MaterialIcon name="edit" className="text-[16px]" />
                            </button>
                            <button
                              className="text-on-surface-variant hover:text-error hover:bg-error-container/50 rounded-full p-1.5 transition-all"
                              title="Delete Resume"
                              onClick={(e) => handleDeleteResume(e, doc.id)}
                            >
                              <MaterialIcon name="delete" className="text-[16px]" />
                            </button>
                          </div>
                        </div>

                        {/* Miniature live paper preview thumbnail */}
                        <div className="mx-4 flex-1 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-outline-variant/40 shadow-inner overflow-hidden relative pointer-events-none group-hover:border-primary/40 transition-all duration-300 flex justify-center items-start pt-2">
                          {previews[doc.id] ? (
                            <div className="w-[794px] h-[1123px] origin-top center scale-[0.27] shrink-0 pointer-events-none select-none bg-white text-black p-6 shadow-md rounded-lg">
                              <JakeResumePreview data={previews[doc.id]} />
                            </div>
                          ) : (
                            <div className="w-full h-full p-4 flex flex-col gap-2 opacity-40 animate-pulse bg-surface-container-low/30">
                              <div className="w-1/2 h-3 bg-primary/40 rounded mx-auto" />
                              <div className="w-1/3 h-2 bg-on-surface-variant/30 rounded mx-auto mb-2" />
                              <div className="h-[1px] bg-outline-variant/40 w-full mb-2" />
                              <div className="w-1/4 h-2 bg-primary/30 rounded" />
                              <div className="w-full h-1.5 bg-on-surface-variant/20 rounded" />
                              <div className="w-5/6 h-1.5 bg-on-surface-variant/20 rounded" />
                            </div>
                          )}

                          {/* Subtle Clean Bottom Fade Overlay */}
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/70 to-transparent pointer-events-none" />
                        </div>

                        {/* Card Footer */}
                        <div className="p-4 pt-3 shrink-0 z-10">
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
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between gap-2 group/title">
                                <p className="font-bold text-on-surface truncate text-base flex-1 group-hover:text-primary transition-colors">{doc.title}</p>
                              </div>
                              <div className="flex items-center justify-between mt-1 text-on-surface-variant text-xs">
                                <div className="flex items-center gap-1.5">
                                  <MaterialIcon name="schedule" className="text-[14px] opacity-70" />
                                  <span>
                                    {new Date(doc.updated_at).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                                <span className="text-secondary text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Open &amp; Edit <MaterialIcon name="arrow_forward" className="text-[12px]" />
                                </span>
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
              <JakeResumeBuilder
                resumeId={selectedResumeId}
                initialDataStr={selectedResumeJson}
                onClose={() => {
                  if (typeof window !== "undefined") {
                    window.history.pushState(null, "", window.location.pathname);
                  }
                  setEditorOpen(false);
                  fetchResumes(); // Refresh list after editing
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}