"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";
import type { ResumeData } from "../../../lib/resume";
import MaterialIcon from "../MaterialIcon";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type ResumeOperation = {
  action: "add" | "update" | "delete" | "replace" | "clear";
  section: "personal" | "education" | "experience" | "projects" | "skills" | "technical_skills" | "certifications" | "achievements";
  field?: string | null;
  index?: number | null;
  data?: any;
};

type ResumeChatResponse = {
  reply: string;
  operations: ResumeOperation[];
  needs_clarification: boolean;
  clarifying_question: string;
  conversation_id?: string | null;
};

type ResumeChatbotProps = {
  resumeData: ResumeData;
  onResumeUpdate?: (operations: ResumeOperation[]) => void;
  onClose?: () => void;
};

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem("makemycv_access_token") ||
    window.localStorage.getItem("makemycv_token")
  );
}

export default function ResumeChatbot({
  resumeData,
  onResumeUpdate,
  onClose,
}: ResumeChatbotProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi! I'm NISBot. I can help you build and update your resume. You can ask me to add, change, or remove information from any section.",
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;

    const conversationHistory = messages.map((chatMessage) => ({
      role: chatMessage.role,
      content: chatMessage.content,
    }));

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: trimmedMessage,
    };

    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setIsSending(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

      // Map JakeResumeBuilder format to the AI backend format
      const backendResume = {
        personal: {
          name: resumeData.header.fullName,
          phone: resumeData.header.phone,
          email: resumeData.header.email,
          linkedin: resumeData.header.links.linkedin,
          github: resumeData.header.links.github,
        },
        education: resumeData.education,
        experience: resumeData.experience,
        projects: resumeData.projects,
        skills: resumeData.skills,
      };

      const recentHistory = conversationHistory.slice(-20);

      const response = await fetch(
        `${API_BASE_URL}/ai/resume/chat${
          conversationId ? `?conversation_id=${encodeURIComponent(conversationId)}` : ""
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
          },
          body: JSON.stringify({
            message: trimmedMessage,
            resume: backendResume,
            history: recentHistory,
          }),
        }
      );

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`Resume chat failed (${response.status}): ${responseText}`);
      }

      const data: ResumeChatResponse = JSON.parse(responseText);

      if (data && (data as any).conversation_id) {
        setConversationId((data as any).conversation_id);
      }

      if (data.needs_clarification) {
        setMessages((current) => [
          ...current,
          {
            id: Date.now() + 1,
            role: "assistant",
            content: data.clarifying_question || data.reply || "Could you provide more information?",
          },
        ]);
        return;
      }

      if (Array.isArray(data.operations) && data.operations.length > 0) {
        onResumeUpdate?.(data.operations);
      }

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: data.reply || "I've updated your resume.",
        },
      ]);
    } catch (error) {
      console.error("Resume chatbot error:", error);
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: error instanceof Error ? error.message : "Something went wrong.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface">
        <div className="flex items-center gap-2">
          <MaterialIcon name="smart_toy" className="text-primary" filled />
          <h3 className="text-label-lg font-bold text-on-surface">NISBot</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
          >
            <MaterialIcon name="close" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
        {messages.map((chatMessage) => {
          const isUser = chatMessage.role === "user";
          return (
            <div key={chatMessage.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 animate-in slide-in-from-bottom-2 fade-in duration-300 ${
                  isUser
                    ? "bg-primary text-on-primary rounded-br-sm"
                    : "bg-surface-container text-on-surface rounded-bl-sm"
                }`}
              >
                {chatMessage.content}
              </div>
            </div>
          );
        })}
        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-surface-container px-4 py-3 text-sm text-on-surface-variant animate-pulse">
              NISBot is typing...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-outline-variant bg-surface">
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask NISBot to update your resume..."
            rows={1}
            disabled={isSending}
            className="flex-1 resize-none min-h-[44px] max-h-[120px] rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="h-[44px] w-[44px] shrink-0 rounded-xl bg-primary flex items-center justify-center text-on-primary transition hover:bg-secondary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MaterialIcon name="send" className="text-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}