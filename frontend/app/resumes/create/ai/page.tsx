"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import type { ResumeData } from "../page";
import ResumePreview from "../components/ResumePreview";
import {
  ArrowLeft,
  Bot,
  Send,
  Sparkles,
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  PanelLeft,
} from "lucide-react";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type ResumeOperation = {
  action:
    | "add"
    | "update"
    | "delete"
    | "replace"
    | "clear";

  section:
    | "personal"
    | "education"
    | "experience"
    | "projects"
    | "skills"
    | "technical_skills"
    | "certifications"
    | "achievements";

  field?: string | null;
  index?: number | null;
  data?: any;
};

type ResumeChatResponse = {
  reply: string;
  operations: ResumeOperation[];
  needs_clarification: boolean;
  clarifying_question: string;
};

type ConversationSummary = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
};

type StoredConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type ConversationDetails = ConversationSummary & {
  messages: StoredConversationMessage[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function ResumeAIPage() {
  const router = useRouter();

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  const [message, setMessage] = useState("");

  const [messages, setMessages] =
    useState<ChatMessage[]>([
      {
        id: 1,
        role: "assistant",
        content:
          "Hi! I'm your Resume Chatbot. I can help you add, edit, improve, and analyze your resume. You can also paste a job description and I'll identify the relevant skills.",
      },
    ]);

  const [isSending, setIsSending] =
    useState(false);

  const [resumeData, setResumeData] =
    useState<ResumeData | null>(null);

  const [showPreview, setShowPreview] =
    useState(true);

  const [error, setError] =
    useState("");

  const [conversations, setConversations] =
    useState<ConversationSummary[]>([]);

  const [activeConversationId, setActiveConversationId] =
    useState<string | null>(null);

  const [showHistory, setShowHistory] =
    useState(true);

  const [historySearch, setHistorySearch] =
    useState("");

  const [isLoadingHistory, setIsLoadingHistory] =
    useState(false);

  const [editingConversationId, setEditingConversationId] =
    useState<string | null>(null);

  const [editingTitle, setEditingTitle] =
    useState("");

  const getToken = () =>
    typeof window !== "undefined"
      ? window.localStorage.getItem("makemycv_token")
      : null;

  const authHeaders = () => {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    };
  };

  const loadConversations = async () => {
    const token = getToken();
    if (!token) {
      setError("Please log in to use saved chat history.");
      return;
    }

    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ai/resume/conversations`,
        { headers: authHeaders() }
      );

      if (response.status === 401) {
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data: ConversationSummary[] = await response.json();
      setConversations(data);

      if (data.length > 0) {
        await loadConversation(data[0].id);
      } else {
        await createConversation();
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load chat history."
      );
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const createConversation = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ai/resume/conversations`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const conversation: ConversationDetails = await response.json();

      setConversations((current) => [
        {
          id: conversation.id,
          title: conversation.title,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          message_count: conversation.messages.length,
        },
        ...current.filter((item) => item.id !== conversation.id),
      ]);

      setActiveConversationId(conversation.id);
      setMessages(
        conversation.messages.map((item, index) => ({
          id: index + 1,
          role: item.role,
          content: item.content,
        }))
      );
      setError("");
    } catch (err) {
      console.error("Failed to create conversation:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create a new conversation."
      );
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ai/resume/conversations/${conversationId}`,
        { headers: authHeaders() }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const conversation: ConversationDetails = await response.json();
      setActiveConversationId(conversation.id);
      setMessages(
        conversation.messages.map((item, index) => ({
          id: index + 1,
          role: item.role,
          content: item.content,
        }))
      );
      setError("");
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load this conversation."
      );
    }
  };

  const renameConversation = async (conversationId: string) => {
    const title = editingTitle.trim();
    if (!title) {
      setEditingConversationId(null);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ai/resume/conversations/${conversationId}`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ title }),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const updated: ConversationSummary = await response.json();
      setConversations((current) =>
        current.map((item) =>
          item.id === updated.id
            ? { ...item, title: updated.title, updated_at: updated.updated_at }
            : item
        )
      );
      setEditingConversationId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to rename conversation."
      );
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!window.confirm("Delete this conversation permanently?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ai/resume/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const remaining = conversations.filter(
        (item) => item.id !== conversationId
      );
      setConversations(remaining);

      if (activeConversationId === conversationId) {
        if (remaining.length > 0) {
          await loadConversation(remaining[0].id);
        } else {
          await createConversation();
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete conversation."
      );
    }
  };

  const filteredConversations = conversations.filter((conversation) =>
    conversation.title
      .toLowerCase()
      .includes(historySearch.trim().toLowerCase())
  );

  /* =========================================================
     LOAD SAVED RESUME
  ========================================================= */

  useEffect(() => {
    try {
      const savedResume =
        localStorage.getItem(
          "makemycv_resume"
        );

      if (savedResume) {
        setResumeData(
          JSON.parse(savedResume)
        );
      }
    } catch (err) {
      console.error(
        "Failed to load saved resume:",
        err
      );
    }
  }, []);

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================================
     SYNC RESUME CHANGES
  ========================================================= */

  useEffect(() => {
    const handleResumeUpdated = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<any>;

      if (
        customEvent.detail
      ) {
        setResumeData(
          customEvent.detail
        );
        return;
      }

      try {
        const savedResume =
          localStorage.getItem(
            "makemycv_resume"
          );

        if (savedResume) {
          setResumeData(
            JSON.parse(
              savedResume
            )
          );
        }
      } catch (err) {
        console.error(
          "Failed to sync resume:",
          err
        );
      }
    };

    window.addEventListener(
      "makemycv_resume_updated",
      handleResumeUpdated
    );

    return () => {
      window.removeEventListener(
        "makemycv_resume_updated",
        handleResumeUpdated
      );
    };
  }, []);

  /* =========================================================
     AUTO SCROLL
  ========================================================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isSending) return;

    if (!activeConversationId) {
      await createConversation();
      return;
    }

    setError("");

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: trimmedMessage,
    };

    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setIsSending(true);

    try {
      const currentResume = resumeData || {};

      const response = await fetch(
        `${API_BASE_URL}/api/v1/ai/resume/chat?conversation_id=${encodeURIComponent(activeConversationId)}`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            message: trimmedMessage,
            resume: currentResume,
            history: [],
          }),
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          `Resume chat failed (${response.status}): ${responseText}`
        );
      }

      let data: ResumeChatResponse;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("The backend returned an invalid response.");
      }

      if (Array.isArray(data.operations) && data.operations.length > 0) {
        const updatedResume = applyOperationsLocally(
          currentResume,
          data.operations
        );

        setResumeData(updatedResume);
        localStorage.setItem(
          "makemycv_resume",
          JSON.stringify(updatedResume)
        );

        window.dispatchEvent(
          new CustomEvent("makemycv_resume_updated", {
            detail: updatedResume,
          })
        );
      }

      let assistantReply = data.reply || "";

      if (
        data.needs_clarification &&
        data.clarifying_question &&
        !assistantReply.includes(data.clarifying_question)
      ) {
        assistantReply = assistantReply
          ? `${assistantReply}\n\n${data.clarifying_question}`
          : data.clarifying_question;
      }

      if (!assistantReply) {
        assistantReply = "I processed your request.";
      }

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: assistantReply,
        },
      ]);

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeConversationId
            ? {
                ...conversation,
                message_count: conversation.message_count + 2,
                updated_at: new Date().toISOString(),
                title:
                  conversation.title === "New conversation"
                    ? trimmedMessage.length > 45
                      ? `${trimmedMessage.slice(0, 45)}…`
                      : trimmedMessage
                    : conversation.title,
              }
            : conversation
        )
      );
    } catch (err) {
      console.error("Resume chatbot error:", err);

      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong.";

      setError(errorMessage);

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "I couldn't process that request. Please check that the backend server is running and try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  /* =========================================================
     ENTER KEY
  ========================================================= */

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSend();
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className={`min-h-screen h-screen overflow-hidden bg-[#070b14] text-white flex flex-col transition-all ${showHistory ? "lg:pl-[280px]" : ""}`}>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="h-[68px] shrink-0 border-b border-white/10 bg-[#0a0f1c]/95 backdrop-blur-2xl">
        <div className="h-full w-full max-w-[1700px] mx-auto px-3 sm:px-5 lg:px-7 flex items-center justify-between gap-3">
          {/* LEFT */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="
                h-10 w-10 shrink-0 rounded-xl
                border border-white/10 bg-white/5
                flex items-center justify-center
                hover:bg-white/10 hover:border-white/20
                transition-all
              "
              title="Go back"
            >
              <ArrowLeft size={19} />
            </button>

            <button
              type="button"
              onClick={() => setShowHistory((current) => !current)}
              className="hidden lg:flex h-10 w-10 shrink-0 rounded-xl border border-white/10 bg-white/5 items-center justify-center hover:bg-white/10 transition"
              title={showHistory ? "Hide chat history" : "Show chat history"}
            >
              <PanelLeft size={18} />
            </button>

            <div
              className="
                h-10 w-10 shrink-0 rounded-xl
                bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600
                flex items-center justify-center
                shadow-lg shadow-violet-500/20
              "
            >
              <Bot size={21} />
            </div>

            <div className="min-w-0">
              <h1 className="font-semibold text-[15px] truncate">
                Resume Chatbot
              </h1>
              <p className="text-xs text-white/40 truncate">
                AI-powered resume assistant
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowHistory((current) => !current)}
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5"
              title="Chat history"
            >
              <PanelLeft size={17} />
            </button>
            <div
              className="
                hidden sm:flex items-center gap-2
                rounded-full border border-emerald-400/20
                bg-emerald-400/5 px-3 py-1.5
                text-xs text-emerald-300
              "
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              AI Ready
            </div>

            {/* PREVIEW TOGGLE */}
            <button
              type="button"
              onClick={() => setShowPreview((current) => !current)}
              className={`
                inline-flex items-center gap-2
                rounded-xl border px-3 sm:px-4 py-2
                text-sm font-medium transition-all
                ${
                  showPreview
                    ? "border-violet-400/30 bg-violet-500/15 text-violet-200"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                }
              `}
              title={
                showPreview
                  ? "Hide resume preview"
                  : "Show resume preview"
              }
            >
              <span className="hidden sm:inline">
                {showPreview
                  ? "Hide Preview"
                  : "Show Preview"}
              </span>
              <span className="sm:hidden">
                {showPreview ? "Preview" : "Chat"}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/resumes/create")
              }
              className="
                hidden sm:inline-flex
                rounded-xl border border-white/10
                bg-white/5 px-4 py-2
                text-sm text-white/80
                hover:bg-white/10 hover:border-white/20
                transition-all
              "
            >
              Resume Editor
            </button>
          </div>
        </div>
      </header>

      {showHistory && (
        <aside className="fixed z-40 left-0 top-[68px] bottom-0 w-[280px] border-r border-white/10 bg-[#090e19]/98 backdrop-blur-2xl flex flex-col">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <p className="text-sm font-semibold">Chat history</p>
                <p className="text-[11px] text-white/35 mt-1">Your conversations are saved to your account.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="lg:hidden h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <button
              type="button"
              onClick={createConversation}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-3 py-2.5 text-sm font-medium hover:brightness-110 transition"
            >
              <Plus size={17} />
              New chat
            </button>

            <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <Search size={15} className="text-white/35" />
              <input
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Search conversations"
                className="w-full bg-transparent outline-none text-xs text-white placeholder:text-white/25"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoadingHistory && (
              <p className="px-3 py-4 text-xs text-white/35">Loading conversations…</p>
            )}

            {!isLoadingHistory && filteredConversations.length === 0 && (
              <p className="px-3 py-8 text-center text-xs text-white/30">No conversations found.</p>
            )}

            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group rounded-xl mb-1 p-1 ${
                  conversation.id === activeConversationId
                    ? "bg-violet-500/10 border border-violet-400/15"
                    : "hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                {editingConversationId === conversation.id ? (
                  <div className="p-2">
                    <input
                      autoFocus
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") renameConversation(conversation.id);
                        if (event.key === "Escape") setEditingConversationId(null);
                      }}
                      className="w-full rounded-lg border border-violet-400/30 bg-black/20 px-2 py-2 text-xs outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => loadConversation(conversation.id)}
                      className="min-w-0 flex-1 text-left px-2.5 py-2.5"
                    >
                      <p className="truncate text-xs font-medium text-white/80">
                        {conversation.title}
                      </p>
                      <p className="mt-1 text-[10px] text-white/25">
                        {conversation.message_count} messages
                      </p>
                    </button>

                    <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingConversationId(conversation.id);
                          setEditingTitle(conversation.title);
                        }}
                        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white/80"
                        title="Rename"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteConversation(conversation.id)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-white/40 hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* =====================================================
          WORKSPACE
      ===================================================== */}

      <section className="flex-1 min-h-0 w-full">
        <div className="h-full w-full max-w-[1700px] mx-auto p-2 sm:p-3 lg:p-4">
          <div
            className={`
              h-full min-h-0 gap-3 lg:gap-4
              ${
                showPreview
                  ? "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(430px,0.72fr)]"
                  : ""
              }
            `}
          >
            {/* =================================================
                CHAT PANEL
            ================================================= */}

            <section
              className={`
                min-h-0 flex flex-col overflow-hidden
                rounded-2xl border border-white/10
                bg-[#0b101c]/80
                shadow-2xl shadow-black/20
                ${
                  showPreview
                    ? "hidden lg:flex"
                    : "flex"
                }
              `}
            >
              {/* CHAT TOP BAR */}
              <div className="shrink-0 px-5 py-4 border-b border-white/10 bg-white/[0.025]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white/90">
                      AI Resume Assistant
                    </p>
                    <p className="text-xs text-white/35 mt-0.5">
                      Ask naturally. I'll update your resume for you.
                    </p>
                  </div>

                  <div className="hidden md:flex items-center gap-2 text-[11px] text-white/35">
                    <span className="h-2 w-2 rounded-full bg-violet-400" />
                    Live updates enabled
                  </div>
                </div>
              </div>

              {/* MESSAGES */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 py-7 sm:py-9">
                  {/* WELCOME */}
                  {messages.length === 1 && (
                    <div className="max-w-2xl mx-auto mb-8 text-center">
                      <div
                        className="
                          mx-auto h-16 w-16 rounded-2xl
                          bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600
                          flex items-center justify-center
                          shadow-xl shadow-violet-500/20
                        "
                      >
                        <Sparkles size={28} />
                      </div>

                      <h2 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight">
                        What would you like to improve?
                      </h2>

                      <p className="mt-3 text-sm sm:text-[15px] text-white/45 leading-7">
                        Add skills, improve projects, analyze a job
                        description, update your details, or ask me
                        anything about your resume.
                      </p>

                      <div className="mt-7 grid sm:grid-cols-2 gap-3 text-left">
                        {[
                          "Add React, Node.js and MongoDB to my skills.",
                          "Improve my project descriptions.",
                          "Analyze this job description and tell me what skills I need.",
                          "Make my resume more professional.",
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() =>
                              setMessage(suggestion)
                            }
                            className="
                              group rounded-2xl
                              border border-white/10
                              bg-white/[0.035]
                              px-4 py-3.5
                              text-left text-sm text-white/65
                              hover:bg-violet-500/[0.08]
                              hover:border-violet-400/20
                              hover:text-white/85
                              transition-all
                            "
                          >
                            <span className="block leading-6">
                              {suggestion}
                            </span>
                            <span className="mt-2 block text-xs text-violet-300/0 group-hover:text-violet-300/70 transition">
                              Use suggestion →
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MESSAGES */}
                  <div className="space-y-5">
                    {messages.map((chatMessage) => {
                      const isUser =
                        chatMessage.role === "user";

                      return (
                        <div
                          key={chatMessage.id}
                          className={`flex ${
                            isUser
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[92%] ${
                              isUser
                                ? "sm:max-w-[76%]"
                                : "sm:max-w-[88%]"
                            }`}
                          >
                            <div className="flex items-end gap-2">
                              {!isUser && (
                                <div
                                  className="
                                    hidden sm:flex
                                    h-8 w-8 shrink-0
                                    rounded-lg
                                    bg-gradient-to-br from-violet-500 to-indigo-600
                                    items-center justify-center
                                  "
                                >
                                  <Bot size={15} />
                                </div>
                              )}

                              <div
                                className={`
                                  rounded-2xl px-4 sm:px-5 py-3.5
                                  ${
                                    isUser
                                      ? "rounded-br-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/20"
                                      : "rounded-bl-md bg-white/[0.055] border border-white/10 text-white/80"
                                  }
                                `}
                              >
                                <div className="whitespace-pre-wrap leading-7 text-sm">
                                  {chatMessage.content}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* LOADING */}
                    {isSending && (
                      <div className="flex justify-start">
                        <div className="flex items-end gap-2">
                          <div
                            className="
                              hidden sm:flex h-8 w-8 shrink-0
                              rounded-lg
                              bg-gradient-to-br from-violet-500 to-indigo-600
                              items-center justify-center
                            "
                          >
                            <Bot size={15} />
                          </div>

                          <div
                            className="
                              rounded-2xl rounded-bl-md
                              border border-white/10
                              bg-white/[0.055]
                              px-5 py-4
                            "
                          >
                            <div className="flex gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-violet-300/70 animate-bounce" />
                              <span
                                className="h-2 w-2 rounded-full bg-violet-300/70 animate-bounce"
                                style={{
                                  animationDelay: "150ms",
                                }}
                              />
                              <span
                                className="h-2 w-2 rounded-full bg-violet-300/70 animate-bounce"
                                style={{
                                  animationDelay: "300ms",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="shrink-0 px-4 sm:px-6">
                  <div
                    className="
                      mb-2 rounded-xl
                      border border-red-400/20
                      bg-red-400/5
                      px-4 py-3
                      text-sm text-red-300
                    "
                  >
                    {error}
                  </div>
                </div>
              )}

              {/* INPUT */}
              <div className="shrink-0 border-t border-white/10 bg-[#080c16]/95 backdrop-blur-xl">
                <div className="max-w-[900px] mx-auto px-3 sm:px-5 py-3.5">
                  <div
                    className="
                      flex items-end gap-2
                      rounded-2xl
                      border border-white/10
                      bg-white/[0.045]
                      p-2
                      shadow-inner
                      focus-within:border-violet-400/40
                      focus-within:ring-2
                      focus-within:ring-violet-500/10
                      transition-all
                    "
                  >
                    <textarea
                      value={message}
                      onChange={(event) =>
                        setMessage(
                          event.target.value
                        )
                      }
                      onKeyDown={handleKeyDown}
                      disabled={isSending}
                      rows={1}
                      placeholder="Ask me anything about your resume..."
                      className="
                        flex-1 resize-none
                        bg-transparent outline-none
                        px-3 py-3
                        text-sm text-white
                        placeholder:text-white/30
                        min-h-[46px] max-h-40
                      "
                    />

                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={
                        !message.trim() ||
                        isSending
                      }
                      className="
                        h-11 w-11 shrink-0
                        rounded-xl
                        bg-gradient-to-br from-violet-500 to-indigo-600
                        flex items-center justify-center
                        disabled:opacity-30
                        disabled:cursor-not-allowed
                        hover:brightness-110
                        hover:shadow-lg hover:shadow-violet-500/20
                        transition-all
                      "
                      title="Send"
                    >
                      <Send size={18} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2 px-1">
                    <p className="text-[11px] text-white/25">
                      Enter to send • Shift + Enter for a new line
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowPreview(true)}
                      className="lg:hidden text-[11px] text-violet-300/70 hover:text-violet-200"
                    >
                      View resume →
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                LIVE RESUME PREVIEW
            ================================================= */}

            {showPreview && (
              <aside
                className="
                  min-h-0 flex flex-col
                  rounded-2xl
                  border border-white/10
                  bg-[#0b101c]/90
                  shadow-2xl shadow-black/20
                  overflow-hidden
                "
              >
                {/* PREVIEW HEADER */}
                <div className="shrink-0 px-4 sm:px-5 py-4 border-b border-white/10 bg-white/[0.025]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <h2 className="text-sm font-semibold text-white/90">
                          Live Resume Preview
                        </h2>
                      </div>
                      <p className="mt-1 text-xs text-white/35">
                        Updates instantly when the AI changes your resume.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          "/resumes/create"
                        )
                      }
                      className="
                        shrink-0 rounded-lg
                        border border-white/10
                        bg-white/5
                        px-3 py-2
                        text-xs font-medium
                        text-white/70
                        hover:bg-white/10
                        transition-all
                      "
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* PREVIEW BODY */}
                <div className="flex-1 min-h-0 overflow-y-auto bg-[#111827] p-3 sm:p-4">
                  {resumeData ? (
                    <div
                      className="
                        min-h-full
                        rounded-xl
                        bg-white
                        shadow-2xl
                        overflow-hidden
                      "
                    >
                      <ResumePreview
                        data={resumeData}
                      />
                    </div>
                  ) : (
                    <div
                      className="
                        min-h-full rounded-xl
                        border border-white/10
                        bg-white/[0.035]
                        flex items-center justify-center
                        p-8
                      "
                    >
                      <div className="text-center max-w-sm">
                        <div
                          className="
                            mx-auto h-14 w-14 rounded-2xl
                            bg-violet-500/10
                            border border-violet-400/15
                            flex items-center justify-center
                          "
                        >
                          <Sparkles
                            size={24}
                            className="text-violet-300"
                          />
                        </div>

                        <h3 className="mt-4 font-semibold text-white/85">
                          Your resume will appear here
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-white/35">
                          Complete the resume form once, then
                          use the chatbot to update it instantly.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              "/resumes/create"
                            )
                          }
                          className="
                            mt-5 rounded-xl
                            bg-gradient-to-r
                            from-violet-500 to-indigo-600
                            px-4 py-2.5
                            text-sm font-medium
                            hover:brightness-110
                            transition
                          "
                        >
                          Open Resume Editor
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* MOBILE BACK TO CHAT */}
                <div className="lg:hidden shrink-0 border-t border-white/10 p-3 bg-[#080c16]">
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="
                      w-full rounded-xl
                      border border-white/10
                      bg-white/5
                      px-4 py-3
                      text-sm font-medium
                      text-white/75
                      hover:bg-white/10
                      transition
                    "
                  >
                    ← Back to Chat
                  </button>
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   STRUCTURED RESUME OPERATION HANDLER
   ============================================================

   The backend returns structured operations such as:

   {
     "action": "add",
     "section": "skills",
     "data": {
       "name": "FastAPI",
       "category": "Technical"
     }
   }

   This function applies those operations to the resume object,
   saves the result to localStorage, and allows the Resume Editor
   to read the updated data.
============================================================ */

function applyOperationsLocally(
  resume: any,
  operations: ResumeOperation[]
) {
  const updated = {
    ...resume,
  };

  for (const operation of operations) {
    const {
      action,
      section,
      field,
      index,
      data,
    } = operation;

    /* ========================================================
       PERSONAL
    ======================================================== */

    if (
      section === "personal"
    ) {
      updated.personal = {
        ...(updated.personal || {}),
      };

      if (
        action === "update" &&
        field
      ) {
        updated.personal[field] =
          String(
            data ?? ""
          );
      }

      if (
        action === "replace" &&
        data &&
        typeof data === "object"
      ) {
        updated.personal = {
          ...updated.personal,
          ...data,
        };
      }

      continue;
    }

    /* ========================================================
       EDUCATION
    ======================================================== */

    if (
      section === "education"
    ) {
      if (
        action === "replace" &&
        data &&
        typeof data === "object"
      ) {
        updated.education = {
          ...updated.education,
          ...data,
        };
      }

      continue;
    }

    /* ========================================================
       EXPERIENCE
    ======================================================== */

    if (
      section === "experience"
    ) {
      const experience =
        Array.isArray(
          updated.experience
        )
          ? [
              ...updated.experience,
            ]
          : [];

      if (
        action === "add" &&
        data
      ) {
        experience.push(
          data
        );
      }

      if (
        action === "update" &&
        index !== null &&
        index !== undefined &&
        experience[index]
      ) {
        experience[index] = {
          ...experience[index],
          ...(field
            ? {
                [field]:
                  data,
              }
            : data),
        };
      }

      if (
        action === "delete" &&
        index !== null &&
        index !== undefined
      ) {
        experience.splice(
          index,
          1
        );
      }

      updated.experience =
        experience;

      continue;
    }

    /* ========================================================
       PROJECTS
    ======================================================== */

    if (
      section === "projects"
    ) {
      const projects =
        Array.isArray(
          updated.projects
        )
          ? [
              ...updated.projects,
            ]
          : [];

      if (
        action === "add" &&
        data
      ) {
        projects.push(
          data
        );
      }

      if (
        action === "update" &&
        index !== null &&
        index !== undefined &&
        projects[index]
      ) {
        projects[index] = {
          ...projects[index],
          ...(field
            ? {
                [field]:
                  data,
              }
            : data),
        };
      }

      if (
        action === "delete" &&
        index !== null &&
        index !== undefined
      ) {
        projects.splice(
          index,
          1
        );
      }

      updated.projects =
        projects;

      continue;
    }

    /* ========================================================
       SKILLS
    ======================================================== */

    if (
      section === "skills" ||
      section ===
        "technical_skills"
    ) {
      const skills =
        Array.isArray(
          updated.skills
        )
          ? [
              ...updated.skills,
            ]
          : [];

      if (
        action === "add" &&
        data
      ) {
        const newSkill =
          typeof data === "string"
            ? {
                name: data.trim(),
                category: "Technical",
              }
            : {
                ...data,
                name: String(
                  data.name ?? ""
                ).trim(),
                category:
                  data.category ||
                  "Technical",
              };

        if (newSkill.name) {
          const alreadyExists =
            skills.some(
              (skill: any) =>
                String(
                  skill?.name ?? ""
                ).trim().toLowerCase() ===
                newSkill.name
                  .toLowerCase()
            );

          if (!alreadyExists) {
            skills.push(newSkill);
          }
        }
      }

      if (
        action === "update"
      ) {
        if (
          index !== null &&
          index !== undefined &&
          skills[index]
        ) {
          skills[index] = {
            ...skills[index],
            ...(field
              ? {
                  [field]:
                    data,
                }
              : data),
          };
        } else if (
          data &&
          typeof data === "object" &&
          data.name
        ) {
          const targetIndex =
            skills.findIndex(
              (skill: any) =>
                String(
                  skill?.name ?? ""
                ).trim().toLowerCase() ===
                String(
                  data.name
                ).trim().toLowerCase()
            );

          if (targetIndex >= 0) {
            skills[targetIndex] = {
              ...skills[targetIndex],
              ...data,
            };
          }
        }
      }

      if (
        action === "delete"
      ) {
        if (
          index !== null &&
          index !== undefined &&
          skills[index]
        ) {
          skills.splice(
            index,
            1
          );
        } else if (
          typeof data === "string"
        ) {
          const targetName =
            data.trim().toLowerCase();

          updated.skills =
            skills.filter(
              (skill: any) =>
                String(
                  skill?.name ?? ""
                ).trim().toLowerCase() !==
                targetName
            );

          continue;
        } else if (
          data &&
          typeof data === "object" &&
          data.name
        ) {
          const targetName =
            String(
              data.name
            ).trim().toLowerCase();

          updated.skills =
            skills.filter(
              (skill: any) =>
                String(
                  skill?.name ?? ""
                ).trim().toLowerCase() !==
                targetName
            );

          continue;
        }
      }

      updated.skills =
        skills;

      continue;
    }

    /* ========================================================
       CERTIFICATIONS
    ======================================================== */

    if (
      section ===
      "certifications"
    ) {
      const certifications =
        Array.isArray(
          updated.certifications
        )
          ? [
              ...updated.certifications,
            ]
          : [];

      if (
        action === "add" &&
        data
      ) {
        certifications.push(
          data
        );
      }

      if (
        action === "delete" &&
        index !== null &&
        index !== undefined
      ) {
        certifications.splice(
          index,
          1
        );
      }

      if (
        action === "update" &&
        index !== null &&
        index !== undefined &&
        certifications[index]
      ) {
        certifications[index] =
          {
            ...certifications[
              index
            ],
            ...(field
              ? {
                  [field]:
                    data,
                }
              : data),
          };
      }

      updated.certifications =
        certifications;

      continue;
    }

    /* ========================================================
       ACHIEVEMENTS
    ======================================================== */

    if (
      section ===
      "achievements"
    ) {
      const achievements =
        Array.isArray(
          updated.achievements
        )
          ? [
              ...updated.achievements,
            ]
          : [];

      if (
        action === "add" &&
        data
      ) {
        achievements.push(
          data
        );
      }

      if (
        action === "delete" &&
        index !== null &&
        index !== undefined
      ) {
        achievements.splice(
          index,
          1
        );
      }

      if (
        action === "update" &&
        index !== null &&
        index !== undefined &&
        achievements[index]
      ) {
        achievements[index] =
          {
            ...achievements[
              index
            ],
            ...(field
              ? {
                  [field]:
                    data,
                }
              : data),
          };
      }

      updated.achievements =
        achievements;

      continue;
    }
  }

  return updated;
}