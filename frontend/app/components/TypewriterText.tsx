"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TypewriterTextProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBeforeDelete?: number;
  delayBeforeType?: number;
  className?: string;
}

export function TypewriterText({
  words,
  typingSpeed = 70,
  deletingSpeed = 40,
  delayBeforeDelete = 2000,
  delayBeforeType = 500,
  className,
}: TypewriterTextProps) {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleType = () => {
      const currentWord = words[loopNum % words.length];

      if (isDeleting) {
        setText(currentWord.substring(0, text.length - 1));
      } else {
        setText(currentWord.substring(0, text.length + 1));
      }

      if (!isDeleting && text === currentWord) {
        // Pause before deleting
        timeoutId = setTimeout(() => setIsDeleting(true), delayBeforeDelete);
      } else if (isDeleting && text === "") {
        // Pause before typing next word
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        timeoutId = setTimeout(() => {}, delayBeforeType);
      } else {
        // Continue typing or deleting
        timeoutId = setTimeout(
          handleType,
          isDeleting ? deletingSpeed : typingSpeed
        );
      }
    };

    timeoutId = setTimeout(
      handleType,
      isDeleting ? deletingSpeed : typingSpeed
    );

    return () => clearTimeout(timeoutId);
  }, [
    text,
    isDeleting,
    loopNum,
    words,
    typingSpeed,
    deletingSpeed,
    delayBeforeDelete,
    delayBeforeType,
  ]);

  return (
    <span className={cn("inline-flex items-center", className)}>
      <span>{text}</span>
      <span className="ml-1 w-[2px] h-[1em] bg-current animate-cursor-blink opacity-70 block" />
    </span>
  );
}
