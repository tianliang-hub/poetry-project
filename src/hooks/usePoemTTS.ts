import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Browser-native Chinese TTS recital using Web Speech API.
 * - Voices load asynchronously — listen to `voiceschanged` event.
 * - Must be triggered inside a user gesture (button click).
 * - Chrome quirk: call `resume()` in case the synth engine is suspended.
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
      lang.startsWith("zh") ||
      ["chinese", "mandarin", "中文", "普通话", "國語", "国语"].some(
        (k) => name.includes(k.toLowerCase()) || voice.name.includes(k),
      )
    );
  }, []);

  const preferredVoice = useMemo(
    () => voices.find(matchesChineseVoice) ?? null,
    [matchesChineseVoice, voices],
  );

  const refreshVoices = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
    const next = window.speechSynthesis.getVoices();
    if (next.length > 0) {
      setVoices(next);
      setHasChineseVoice(next.some(matchesChineseVoice));
    }
    return next;
  }, [matchesChineseVoice]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setIsSupported(true);

    let pollId: number | undefined;
    let attempts = 0;

    const loadVoices = () => {
      const next = refreshVoices();
      if (next.length === 0 && attempts < 10) {
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
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        console.warn("[TTS] speechSynthesis not available");
        return;
      }
      const trimmed = text.trim();
      if (!trimmed) return;

      const synth = window.speechSynthesis;
      // Reset any pending queue (paused state in Chrome will swallow speak())
      synth.cancel();
      synth.resume();

      // Create utterance INSIDE the gesture handler (browser security)
      const utter = new SpeechSynthesisUtterance(trimmed);
      utter.lang = "zh-CN";
      utter.rate = 0.75;
      utter.pitch = 1.0;
      utter.volume = 1.0;

      const list = voices.length ? voices : refreshVoices();
      const zhVoice = preferredVoice ?? list.find(matchesChineseVoice);
      if (zhVoice) utter.voice = zhVoice;

      utter.onstart = () => {
        console.log("[TTS] start", { voice: zhVoice?.name, lang: utter.lang });
        setIsSpeaking(true);
      };
      utter.onend = () => {
        console.log("[TTS] end");
        setIsSpeaking(false);
      };
      utter.onerror = (e) => {
        console.error("[TTS] error", e);
        setIsSpeaking(false);
      };

      utterRef.current = utter;
      // Optimistic state — onstart can lag in some browsers
      setIsSpeaking(true);

      try {
        synth.speak(utter);
      } catch (err) {
        console.error("[TTS] speak threw", err);
        setIsSpeaking(false);
      }

      // Chrome bug: if speech doesn't start in 250ms, resume + retry
      window.setTimeout(() => {
        if (!synth.speaking && !synth.pending) {
          console.warn("[TTS] not speaking after 250ms, retrying");
          synth.resume();
          try {
            synth.speak(utter);
          } catch (err) {
            console.error("[TTS] retry failed", err);
            setIsSpeaking(false);
          }
        }
      }, 250);
    },
    [matchesChineseVoice, preferredVoice, refreshVoices, voices],
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
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
