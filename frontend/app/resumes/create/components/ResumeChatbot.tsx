"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";
import type { ResumeData } from "../page";

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
  conversation_id?: string | null;
};

type ResumeChatbotProps = {
  resumeData: ResumeData;

  onResumeUpdate?: (
    operations: ResumeOperation[]
  ) => void;
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
}: ResumeChatbotProps) {
  const [message, setMessage] = useState("");

  const [messages, setMessages] =
    useState<ChatMessage[]>([
      {
        id: 1,
        role: "assistant",
        content:
          "Hi! I can help you build and update your resume. You can ask me to add, change, or remove information from any section.",
      },
    ]);

  const [isSending, setIsSending] =
    useState(false);

  const [conversationId, setConversationId] =
    useState<string | null>(null);

  const handleSend = async () => {
    const trimmedMessage =
      message.trim();

    if (
      !trimmedMessage ||
      isSending
    ) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * Save the current conversation BEFORE
     * adding the new user message.
     *
     * This becomes the conversation history
     * sent to the backend.
     */
    const conversationHistory =
      messages.map((chatMessage) => ({
        role: chatMessage.role,
        content: chatMessage.content,
      }));

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: trimmedMessage,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setMessage("");

    setIsSending(true);

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://127.0.0.1:8000";

      // The AI chat endpoint works directly with the
      // frontend ResumeData shape so operations can be
      // applied without lossy conversions.
      const backendResume = resumeData;

      /*
       * Keep only the most recent messages.
       *
       * This prevents the prompt from becoming
       * unnecessarily large after a long conversation.
       */
      const recentHistory =
        conversationHistory.slice(-20);

      const response = await fetch(
        `${API_BASE_URL}/api/v1/ai/resume/chat${conversationId ? `?conversation_id=${encodeURIComponent(conversationId)}` : ""}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(getAccessToken()
              ? { Authorization: `Bearer ${getAccessToken()}` }
              : {}),
          },

          body: JSON.stringify({
            message:
              trimmedMessage,

            resume:
              backendResume,

            history:
              recentHistory,
          }),
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          `Resume chat failed (${response.status}): ${responseText}`
        );
      }

      const data: ResumeChatResponse =
        JSON.parse(responseText);

      if (data && (data as any).conversation_id) {
        setConversationId((data as any).conversation_id);
      }

      /*
       * AI needs more information.
       *
       * Do not modify the resume.
       *
       * IMPORTANT:
       * We still add the AI's clarification
       * question to the conversation history.
       *
       * Therefore the next user message can
       * answer that question.
       */
      if (
        data.needs_clarification
      ) {
        setMessages((current) => [
          ...current,

          {
            id:
              Date.now() + 1,

            role: "assistant",

            content:
              data.clarifying_question ||
              data.reply ||
              "Could you provide more information?",
          },
        ]);

        return;
      }

      /*
       * Apply AI-generated resume operations.
       */
      if (
        Array.isArray(
          data.operations
        ) &&
        data.operations.length > 0
      ) {
        onResumeUpdate?.(
          data.operations
        );
      }

      /*
       * Add AI response to local
       * conversation history.
       */
      setMessages((current) => [
        ...current,

        {
          id:
            Date.now() + 1,

          role: "assistant",

          content:
            data.reply ||
            "I've updated your resume.",
        },
      ]);
    } catch (error) {
      console.error(
        "Resume chatbot error:",
        error
      );

      setMessages((current) => [
        ...current,

        {
          id:
            Date.now() + 1,

          role: "assistant",

          content:
            error instanceof Error
              ? error.message
              : "Something went wrong while updating your resume.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      void handleSend();
    }
  };

  return (
    <section className="mt-10">

      {/* Header */}

      <div className="mb-4">

        <h2 className="text-2xl font-bold text-on-surface">
          AI Resume Assistant
        </h2>

        <p className="mt-1 text-sm text-on-surface-variant">
          Tell the assistant what you want to add,
          change, or remove from your resume.
        </p>

      </div>


      {/* Chat Container */}

      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">

        {/* Messages */}

        <div className="min-h-[320px] max-h-[500px] overflow-y-auto p-4 sm:p-6 space-y-4">

          {messages.map(
            (chatMessage) => {

              const isUser =
                chatMessage.role ===
                "user";

              return (
                <div
                  key={
                    chatMessage.id
                  }
                  className={`flex ${
                    isUser
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  <div
                    className={`
                      max-w-[85%]
                      sm:max-w-[75%]
                      rounded-2xl
                      px-4
                      py-3
                      text-sm
                      leading-6
                      ${
                        isUser
                          ? "bg-primary text-on-primary rounded-br-md"
                          : "bg-surface-container text-on-surface rounded-bl-md"
                      }
                    `}
                  >
                    {
                      chatMessage.content
                    }
                  </div>

                </div>
              );
            }
          )}

          {isSending && (
            <div className="flex justify-start">

              <div className="rounded-2xl rounded-bl-md bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
                Thinking...
              </div>

            </div>
          )}

        </div>


        {/* Input */}

        <div className="border-t border-outline-variant p-3 sm:p-4">

          <div className="flex items-end gap-3">

            <textarea
              value={message}

              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }

              onKeyDown={
                handleKeyDown
              }

              placeholder="Tell me what you want to change in your resume..."

              rows={2}

              disabled={
                isSending
              }

              className="
                min-h-[52px]
                max-h-[140px]
                flex-1
                resize-none
                rounded-xl
                border
                border-outline-variant
                bg-surface
                px-4
                py-3
                text-sm
                text-on-surface
                outline-none
                transition
                focus:border-primary
                focus:ring-2
                focus:ring-primary/20
                disabled:opacity-60
              "
            />

            <button
              type="button"

              onClick={() =>
                void handleSend()
              }

              disabled={
                !message.trim() ||
                isSending
              }

              className="
                h-[52px]
                shrink-0
                rounded-xl
                bg-primary
                px-5
                font-semibold
                text-on-primary
                transition
                hover:bg-secondary
                active:scale-95
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {
                isSending
                  ? "..."
                  : "Send"
              }
            </button>

          </div>

          <p className="mt-2 px-1 text-xs text-on-surface-variant">
            Press Enter to send · Shift + Enter for a new line
          </p>

        </div>

      </div>

    </section>
  );
}