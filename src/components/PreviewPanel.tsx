import { motion, AnimatePresence } from "framer-motion";
import type { GenerationStyle, OutputType } from "@/pages/Index";

interface PreviewPanelProps {
  isGenerating: boolean;
  generatedUrl: string | null;
  poem: string;
  style: GenerationStyle;
  outputType: OutputType;
}

const styleLabels: Record<GenerationStyle, string> = {
  "ink-wash": "水墨意蕴",
  "gongbi": "工笔重彩",
  "cinematic": "写实电影",
};

const PreviewPanel = ({ isGenerating, generatedUrl, poem, style, outputType }: PreviewPanelProps) => {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-ink-surface">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(0 0% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 50%) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      <AnimatePresence mode="wait">
        {isGenerating ? (
          /* Ink spread loading */
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground tracking-widest"
            >
              正在构图...
            </motion.p>
          </motion.div>
        ) : generatedUrl ? (
          /* Generated result placeholder */
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-6 px-8"
          >
            {/* Mock generated image area */}
            <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-xl ink-glass">
              <div className="flex h-full min-h-[360px] items-center justify-center">
                <div className="text-center px-8">
                  <p className="font-serif text-2xl leading-[2] text-foreground/90 tracking-wider">
                    {poem || "诗意画境"}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="h-px w-8 bg-muted-foreground/30" />
                    <span className="text-xs text-muted-foreground">{styleLabels[style]}</span>
                    <div className="h-px w-8 bg-muted-foreground/30" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button className="rounded-lg bg-foreground px-6 py-2.5 text-xs font-medium text-background transition-all hover:scale-[1.02] active:scale-[0.98]">
                {outputType === "image" ? "导出 4K 图片" : "导出视频"}
              </button>
              <button className="rounded-lg bg-secondary px-6 py-2.5 text-xs font-medium text-foreground transition-all hover:scale-[1.02] active:scale-[0.98]">
                重新生成
              </button>
            </div>
          </motion.div>
        ) : (
          /* Empty state */
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
              <p className="text-sm text-muted-foreground">
                暂无意象
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                请输入一段诗词，开启画境
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-8 py-4 text-[10px] text-muted-foreground/40">
        <span className="font-lora">Verse to Vision</span>
        <span>让千年的诗意，在像素间重燃</span>
      </div>
    </div>
  );
};

export default PreviewPanel;
