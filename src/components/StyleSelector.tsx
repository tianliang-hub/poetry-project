import { motion } from "framer-motion";
import type { GenerationStyle } from "@/pages/Index";

interface StyleSelectorProps {
  selected: GenerationStyle;
  onSelect: (style: GenerationStyle) => void;
}

const styles: { key: GenerationStyle; label: string; sublabel: string; desc: string }[] = [
  { key: "ink-wash", label: "水墨意蕴", sublabel: "Ink Wash", desc: "淡墨远山，留白如诗" },
  { key: "gongbi", label: "工笔重彩", sublabel: "Gongbi", desc: "细腻勾勒，浓墨重彩" },
  { key: "cinematic", label: "写实电影", sublabel: "Cinematic", desc: "光影叙事，镜头语言" },
];

const StyleSelector = ({ selected, onSelect }: StyleSelectorProps) => {
  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground tracking-widest uppercase">
        风格选择
      </p>
      <div className="grid grid-cols-3 gap-3">
        {styles.map((style) => (
          <motion.button
            key={style.key}
            onClick={() => onSelect(style.key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative aspect-[3/4] overflow-hidden rounded-xl p-4 text-left transition-all duration-300 flex flex-col justify-end ${
              selected === style.key
                ? "ink-glass ring-2 ring-foreground/20"
                : "bg-secondary/50 hover:bg-secondary"
            }`}
          >
            {/* Decorative top element */}
            <div className={`absolute top-4 left-4 h-1 w-6 rounded-sm transition-colors duration-300 ${
              selected === style.key ? "bg-primary" : "bg-muted-foreground/20"
            }`} />

            <div>
              <span className="block text-sm font-medium text-foreground">
                {style.label}
              </span>
              <span className="block text-[10px] font-lora text-muted-foreground mt-0.5">
                {style.sublabel}
              </span>
              <span className="block text-[10px] text-muted-foreground mt-2 leading-relaxed">
                {style.desc}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default StyleSelector;
