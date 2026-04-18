import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Browser-native Chinese TTS recital using Web Speech API.
 * Picks a Chinese voice when available, falls back to default.
 */
export function usePoemTTS() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
      // Trigger voice list load on some browsers
      window.speechSynthesis.getVoices();
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window) || !text.trim()) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    utter.rate = 0.75; // slow, recital-like
    utter.pitch = 1.0;
    utter.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const zhVoice =
      voices.find((v) => /zh[-_]?CN/i.test(v.lang)) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith("zh"));
    if (zhVoice) utter.voice = zhVoice;

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, []);

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { isSupported, isSpeaking, speak, stop };
}
