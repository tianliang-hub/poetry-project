import { motion, AnimatePresence } from "framer-motion";
import { usePoemTTS } from "@/hooks/usePoemTTS";
import type { GenerationStyle, OutputType } from "@/pages/Index";

interface PreviewPanelProps {
  isGenerating: boolean;
  generatedUrl: string | null;
  generatedKind: "image" | "video" | null;
  poem: string;
  style: GenerationStyle;
  outputType: OutputType;
  loadingText: string;
  onDownload: () => void;
  onRegenerate: () => void;
}

const styleLabels: Record<GenerationStyle, string> = {
  "ink-wash": "水墨意蕴",
  "gongbi": "工笔重彩",
  "cinematic": "写实电影",
};

const PreviewPanel = ({
  isGenerating,
  generatedUrl,
  generatedKind,
  poem,
  style,
  loadingText,
  onDownload,
  onRegenerate,
}: PreviewPanelProps) => {
  const { isSupported, isSpeaking, hasChineseVoice, speak, stop, refreshVoices } = usePoemTTS();

  const handleRecite = () => {
    if (isSpeaking) stop();
    else speak(poem);
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-ink-surface">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(0 0% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 50%) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="relative h-32 w-32">
              <div className="absolute inset-0 rounded-lg bg-primary/20 ink-loading" />
              <div className="absolute inset-4 rounded-lg bg-primary/15 ink-loading" style={{ animationDelay: "0.5s" }} />
              <div className="absolute inset-8 rounded-lg bg-primary/10 ink-loading" style={{ animationDelay: "1s" }} />
            </div>
            <motion.p
              key={loadingText}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-muted-foreground tracking-widest"
            >
              {loadingText}
            </motion.p>
          </motion.div>
        ) : generatedUrl ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-6 px-8 w-full max-w-3xl"
          >
            {/* Generated media */}
            <div className={`relative w-full overflow-hidden rounded-xl ink-glass ${generatedKind === "video" ? "aspect-video bg-black/20" : ""}`}>
              {generatedKind === "video" ? (
                <img
                  src={generatedUrl}
                  alt={`AI generated scene for: ${poem}`}
                  className="absolute inset-0 w-full h-full object-cover ken-burns"
                />
              ) : (
                <img
                  src={generatedUrl}
                  alt={`AI generated artwork for: ${poem}`}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              )}
            </div>

            {/* Style label */}
            <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-muted-foreground/30" />
              <span className="text-xs text-muted-foreground font-serif tracking-wider">
                {styleLabels[style]} · {generatedKind === "video" ? "运镜视频" : "静态画境"}
              </span>
              <div className="h-px w-8 bg-muted-foreground/30" />
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-3">
              {isSupported && (
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
                  <span>
                    {hasChineseVoice
                      ? "已检测到中文音色，可直接吟诵"
                      : "正在尝试加载中文音色；若仍无声，可点重新检测"}
                  </span>
                  <button
                    onClick={() => refreshVoices()}
                    className="rounded-md border border-border bg-secondary px-3 py-1 text-foreground transition-colors hover:bg-secondary/80"
                  >
                    重新检测语音
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-3 justify-center">
              {isSupported && (
                <button
                  onClick={handleRecite}
                  disabled={!poem.trim()}
                  className={`rounded-lg px-6 py-2.5 text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 ${
                    isSpeaking
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/40"
                      : "bg-foreground/10 text-foreground ring-1 ring-foreground/20 hover:bg-foreground/15"
                  }`}
                >
                  {isSpeaking ? "■ 停止吟诵" : "♪ 古诗吟诵"}
                </button>
              )}
              <button
                onClick={onDownload}
                className="rounded-lg bg-foreground px-6 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {generatedKind === "video" ? "导出视频" : "导出图片"}
              </button>
              <button
                onClick={onRegenerate}
                className="rounded-lg bg-secondary px-6 py-2.5 text-xs font-medium text-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                重新生成
              </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="h-16 w-16 rounded-lg bg-secondary/50 flex items-center justify-center">
              <div className="h-4 w-4 rounded-sm bg-muted-foreground/20" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">暂无意象</p>
              <p className="mt-1 text-xs text-muted-foreground/60">请输入一段诗词，开启画境</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-8 py-4 text-[10px] text-muted-foreground/40">
        <span className="font-lora">Verse to Vision</span>
        <span>让千年的诗意，在像素间重燃</span>
      </div>
    </div>
  );
};

export default PreviewPanel;
