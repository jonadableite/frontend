// src/app/(protected)/dashboard/_components/typewriter-welcome-message.tsx
"use client";

import { useEffect, useState } from "react";

interface TypewriterWelcomeMessageProps {
  userName: string;
}

export function TypewriterWelcomeMessage({ userName }: TypewriterWelcomeMessageProps) {
  const fullText = `Bem-vindo de volta, ${userName}!`;
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < fullText.length) {
      const typingSpeed = 50; // Velocidade da digitação em milissegundos por caractere
      const timeoutId = setTimeout(() => {
        setDisplayedText((prev) => prev + fullText.charAt(index));
        setIndex((prev) => prev + 1);
      }, typingSpeed);

      return () => clearTimeout(timeoutId);
    }
  }, [index, fullText]);

  return (
    <p className="text-muted-foreground inline-block">
      {displayedText}
    </p>
  );
}
