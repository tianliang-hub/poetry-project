import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import PoemInput from "@/components/PoemInput";
import StyleSelector from "@/components/StyleSelector";
import PreviewPanel from "@/components/PreviewPanel";
import ParameterPanel from "@/components/ParameterPanel";

export type GenerationStyle = "ink-wash" | "gongbi" | "cinematic";
export type OutputType = "image" | "video";

export interface GenerationState {
  poem: string;
  keywords: string[];
  style: GenerationStyle;
  outputType: OutputType;
  aspectRatio: string;
  isGenerating: boolean;
  generatedUrl: string | null;
  generatedScenes: string[] | null;
  generatedKind: "image" | "video" | null;
  loadingText: string;
}

const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-poem-image`;
const VIDEO_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-poem-video`;

const imageLoadingTexts = ["正在研墨...", "正在构图...", "意象生成中...", "渲染画境..."];
const videoLoadingTexts = ["正在分镜...", "云烟初起...", "运镜调度中...", "光影流转...", "即将成片..."];

const Index = () => {
  const [state, setState] = useState<GenerationState>({
    poem: "",
    keywords: [],
    style: "ink-wash",
    outputType: "image",
    aspectRatio: "16:9",
    isGenerating: false,
    generatedUrl: null,
    generatedScenes: null,
    generatedKind: null,
    loadingText: imageLoadingTexts[0],
  });

  const [showParams, setShowParams] = useState(false);

  const extractKeywords = (text: string): string[] => {
    const keywordMap: Record<string, string[]> = {
      "月": ["明月"], "松": ["松林"], "泉": ["清泉"], "石": ["山石"],
      "山": ["远山"], "水": ["流水"], "花": ["落花"], "雪": ["飞雪"],
      "风": ["清风"], "云": ["浮云"], "鸟": ["飞鸟"], "烟": ["孤烟"],
      "日": ["落日"], "柳": ["杨柳"], "雨": ["细雨"], "霜": ["秋霜"],
      "竹": ["翠竹"], "梅": ["寒梅"], "江": ["长江"], "河": ["黄河"],
      "天": ["长天"], "沙": ["大漠"],
    };
    const found: string[] = [];
    for (const [char, words] of Object.entries(keywordMap)) {
      if (text.includes(char)) found.push(words[0]);
    }
    return found.length > 0 ? found : text.length > 0 ? ["意境", "画面"] : [];
  };

  const handlePoemChange = (poem: string) => {
    const keywords = poem.trim() ? extractKeywords(poem) : [];
    setState(prev => ({ ...prev, poem, keywords }));
  };

  const handleGenerate = async () => {
    if (!state.poem.trim()) return;
    const isVideo = state.outputType === "video";
    const texts = isVideo ? videoLoadingTexts : imageLoadingTexts;
    setState(prev => ({
      ...prev,
      isGenerating: true,
      generatedUrl: null,
      generatedScenes: null,
      generatedKind: null,
      loadingText: texts[0],
    }));

    let textIndex = 0;
    const interval = setInterval(() => {
      textIndex = (textIndex + 1) % texts.length;
      setState(prev => ({ ...prev, loadingText: texts[textIndex] }));
    }, 2200);

    try {
      const url = isVideo ? VIDEO_URL : IMAGE_URL;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          poem: state.poem,
          style: state.style,
          aspectRatio: state.aspectRatio,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "生成失败");
      }

      const scenes: string[] | undefined = data.scenes;
      const mediaUrl = isVideo
        ? (scenes?.[0] ?? data.videoUrl)
        : data.imageUrl;
      if (mediaUrl) {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          generatedUrl: mediaUrl,
          generatedScenes: isVideo ? (scenes ?? [mediaUrl]) : null,
          generatedKind: isVideo ? "video" : "image",
        }));
        toast.success(
          isVideo
            ? `运镜视频已生成（${scenes?.length ?? 1} 个分镜）`
            : "画境已生成",
        );
      } else {
        throw new Error("未能获取生成结果");
      }
    } catch (err) {
      console.error("Generation error:", err);
      toast.error(err instanceof Error ? err.message : "生成失败，请重试");
      setState(prev => ({ ...prev, isGenerating: false }));
    } finally {
      clearInterval(interval);
    }
  };

  const handleDownload = () => {
    if (!state.generatedUrl) return;
    const link = document.createElement("a");
    link.href = state.generatedUrl;
    const ext = state.generatedKind === "video" ? "mp4" : "png";
    link.download = `诗${state.generatedKind === "video" ? "影" : "画"}_${Date.now()}.${ext}`;
    link.click();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Left Control Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-[40%] min-w-[400px] max-w-[560px] flex-col border-r border-border"
      >
        <div className="flex items-center gap-3 p-8 pb-4">
          <div className="h-2 w-2 rounded-sm bg-primary" />
          <h1 className="font-display text-lg font-bold tracking-wider text-foreground">
            诗画发生器
          </h1>
          <span className="ml-auto font-lora text-xs text-muted-foreground tracking-wide">
            Verse to Vision
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4">
          <PoemInput poem={state.poem} keywords={state.keywords} onPoemChange={handlePoemChange} />

          <div className="mt-12">
            <StyleSelector selected={state.style} onSelect={(style) => setState(prev => ({ ...prev, style }))} />
          </div>

          <div className="mt-8">
            <p className="mb-3 text-xs text-muted-foreground tracking-widest uppercase">输出形式</p>
            <div className="flex gap-3">
              {([
                { key: "image" as const, label: "静态图像", sub: "4K · 数秒" },
                { key: "video" as const, label: "运镜视频", sub: "5s · 约 1-2 分钟" },
              ]).map(item => (
                <button
                  key={item.key}
                  onClick={() => setState(prev => ({ ...prev, outputType: item.key }))}
                  className={`flex-1 rounded-lg px-4 py-3 text-left transition-all duration-300 ${
                    state.outputType === item.key
                      ? "ink-glass ring-1 ring-foreground/20 text-foreground"
                      : "text-muted-foreground hover:text-foreground/70"
                  }`}
                >
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{item.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowParams(!showParams)}
            className="mt-8 text-xs text-muted-foreground hover:text-foreground/70 transition-colors tracking-widest uppercase"
          >
            {showParams ? "收起参数 ▲" : "展开参数 ▼"}
          </button>

          <AnimatePresence>
            {showParams && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <ParameterPanel
                  aspectRatio={state.aspectRatio}
                  onAspectRatioChange={(ar) => setState(prev => ({ ...prev, aspectRatio: ar }))}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 pt-4">
          <button
            onClick={handleGenerate}
            disabled={!state.poem.trim() || state.isGenerating}
            className="w-full rounded-lg bg-foreground py-3.5 text-sm font-medium text-background transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100"
          >
            {state.isGenerating ? state.loadingText : "开始生成"}
          </button>
        </div>
      </motion.div>

      {/* Right Preview Panel */}
      <div className="flex-1">
        <PreviewPanel
          isGenerating={state.isGenerating}
          generatedUrl={state.generatedUrl}
          generatedScenes={state.generatedScenes}
          generatedKind={state.generatedKind}
          poem={state.poem}
          style={state.style}
          outputType={state.outputType}
          loadingText={state.loadingText}
          onDownload={handleDownload}
          onRegenerate={handleGenerate}
        />
      </div>
    </div>
  );
};

export default Index;
