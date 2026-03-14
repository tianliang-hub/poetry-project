import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
}

const Index = () => {
  const [state, setState] = useState<GenerationState>({
    poem: "",
    keywords: [],
    style: "ink-wash",
    outputType: "image",
    aspectRatio: "16:9",
    isGenerating: false,
    generatedUrl: null,
  });

  const [showParams, setShowParams] = useState(false);

  const extractKeywords = (text: string): string[] => {
    const keywordMap: Record<string, string[]> = {
      "月": ["明月", "月光"],
      "松": ["松林", "松树"],
      "泉": ["清泉", "泉水"],
      "石": ["岩石", "山石"],
      "山": ["远山", "山峦"],
      "水": ["流水", "江水"],
      "花": ["落花", "繁花"],
      "雪": ["飞雪", "白雪"],
      "风": ["清风", "山风"],
      "云": ["浮云", "白云"],
      "鸟": ["飞鸟", "归鸟"],
      "烟": ["孤烟", "炊烟"],
      "日": ["落日", "夕阳"],
      "柳": ["杨柳", "垂柳"],
      "雨": ["细雨", "春雨"],
      "霜": ["秋霜", "寒霜"],
      "竹": ["翠竹", "竹林"],
      "梅": ["寒梅", "梅花"],
      "江": ["长江", "江面"],
      "河": ["黄河", "河水"],
      "天": ["长天", "苍天"],
      "沙": ["大漠", "黄沙"],
    };

    const found: string[] = [];
    for (const [char, words] of Object.entries(keywordMap)) {
      if (text.includes(char)) {
        found.push(words[0]);
      }
    }
    return found.length > 0 ? found : text.length > 0 ? ["意境", "画面"] : [];
  };

  const handlePoemChange = (poem: string) => {
    const keywords = poem.trim() ? extractKeywords(poem) : [];
    setState(prev => ({ ...prev, poem, keywords }));
  };

  const handleGenerate = () => {
    if (!state.poem.trim()) return;
    setState(prev => ({ ...prev, isGenerating: true, generatedUrl: null }));
    // Simulate generation
    setTimeout(() => {
      setState(prev => ({ ...prev, isGenerating: false, generatedUrl: "generated" }));
    }, 3500);
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
        {/* Header */}
        <div className="flex items-center gap-3 p-8 pb-4">
          <div className="h-2 w-2 rounded-sm bg-primary" />
          <h1 className="font-display text-lg font-bold tracking-wider text-foreground">
            诗画发生器
          </h1>
          <span className="ml-auto font-lora text-xs text-muted-foreground tracking-wide">
            Verse to Vision
          </span>
        </div>

        {/* Poem Input */}
        <div className="flex-1 overflow-y-auto px-8 py-4">
          <PoemInput
            poem={state.poem}
            keywords={state.keywords}
            onPoemChange={handlePoemChange}
          />

          {/* Style Selector */}
          <div className="mt-12">
            <StyleSelector
              selected={state.style}
              onSelect={(style) => setState(prev => ({ ...prev, style }))}
            />
          </div>

          {/* Output Type Toggle */}
          <div className="mt-8">
            <p className="mb-3 text-xs text-muted-foreground tracking-widest uppercase">
              输出形式
            </p>
            <div className="flex gap-3">
              {([
                { key: "image" as const, label: "静态图像", sub: "4K" },
                { key: "video" as const, label: "运镜视频", sub: "10s" },
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

          {/* Parameters Toggle */}
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

        {/* Generate Button */}
        <div className="p-8 pt-4">
          <button
            onClick={handleGenerate}
            disabled={!state.poem.trim() || state.isGenerating}
            className="w-full rounded-lg bg-foreground py-3.5 text-sm font-medium text-background transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100"
          >
            {state.isGenerating ? "正在研墨..." : "开始生成"}
          </button>
        </div>
      </motion.div>

      {/* Right Preview Panel */}
      <div className="flex-1">
        <PreviewPanel
          isGenerating={state.isGenerating}
          generatedUrl={state.generatedUrl}
          poem={state.poem}
          style={state.style}
          outputType={state.outputType}
        />
      </div>
    </div>
  );
};

export default Index;
