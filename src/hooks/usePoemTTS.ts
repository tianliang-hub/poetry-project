import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Browser-native Chinese TTS recital using Web Speech API.
 * Voices load asynchronously — listen to `voiceschanged` event.
 * Falls back to default voice if no Chinese voice is available.
 */
export function usePoemTTS() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hasChineseVoice, setHasChineseVoice] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const matchesChineseVoice = useCallback((voice: SpeechSynthesisVoice) => {
    const lang = voice.lang?.toLowerCase() ?? "";
    const name = voice.name?.toLowerCase() ?? "";

    return (
      /^zh(?:[-_](cn|sg|hans|tw|hk|mo))?$/i.test(lang) ||
      lang.startsWith("zh") ||
      ["chinese", "mandarin", "中文", "普通话", "國語", "国语"].some(
        (keyword) => name.includes(keyword.toLowerCase()) || voice.name.includes(keyword),
      )
    );
  }, []);

  const preferredVoice = useMemo(
    () => voices.find(matchesChineseVoice) ?? null,
    [matchesChineseVoice, voices],
  );

  const refreshVoices = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];

    const nextVoices = window.speechSynthesis.getVoices();
    if (nextVoices.length > 0) {
      setVoices(nextVoices);
      setHasChineseVoice(nextVoices.some(matchesChineseVoice));
    }

    return nextVoices;
  }, [matchesChineseVoice]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setIsSupported(true);

    let pollId: number | undefined;
    let attempts = 0;

    const loadVoices = () => {
      const nextVoices = refreshVoices();

      if (nextVoices.length === 0 && attempts < 10) {
        attempts += 1;
        pollId = window.setTimeout(loadVoices, 250);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      if (pollId) window.clearTimeout(pollId);
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [refreshVoices]);

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window) || !text.trim()) return;
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "zh-CN";
      utter.rate = 0.75;
      utter.pitch = 1.0;
      utter.volume = 1.0;

      const list = voices.length ? voices : refreshVoices();
      const zhVoice = preferredVoice ?? list.find(matchesChineseVoice);
      if (zhVoice) {
        utter.voice = zhVoice;
      }

      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);

      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
    },
    [matchesChineseVoice, preferredVoice, refreshVoices, voices],
  );

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSupported,
    isSpeaking,
    hasChineseVoice,
    speak,
    stop,
    refreshVoices,
  };
}
