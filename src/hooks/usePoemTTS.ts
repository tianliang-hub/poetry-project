import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Browser-native Chinese TTS recital using Web Speech API.
 * Voices load asynchronously — listen to `voiceschanged` event.
 * Falls back to default voice if no Chinese voice is available.
 */
export function usePoemTTS() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setIsSupported(true);

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoices(v);
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window) || !text.trim()) return;
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "zh-CN";
      utter.rate = 0.75;
      utter.pitch = 1.0;
      utter.volume = 1.0;

      const list = voices.length ? voices : window.speechSynthesis.getVoices();
      const zhVoice =
        list.find((v) => /zh[-_]?CN/i.test(v.lang)) ||
        list.find((v) => v.lang?.toLowerCase().startsWith("zh"));
      if (zhVoice) utter.voice = zhVoice;

      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);

      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
    },
    [voices],
  );

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { isSupported, isSpeaking, speak, stop };
}
