import { motion, AnimatePresence } from "framer-motion";

interface PoemInputProps {
  poem: string;
  keywords: string[];
  onPoemChange: (poem: string) => void;
}

const charVariants = {
  hidden: { opacity: 0, filter: "blur(8px)" },
  visible: { opacity: 1, filter: "blur(0px)" },
};

const PoemInput = ({ poem, keywords, onPoemChange }: PoemInputProps) => {
  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground tracking-widest uppercase">
        诗词输入
      </p>
      <div className="relative">
        <textarea
          value={poem}
          onChange={(e) => onPoemChange(e.target.value)}
          placeholder="明月松间照，清泉石上流。"
          rows={5}
          className="w-full resize-none border-b border-border bg-transparent pb-4 pt-2 font-serif text-xl leading-[2] text-foreground placeholder:text-muted-foreground/40 focus:border-muted-foreground focus:outline-none transition-colors duration-300"
        />
      </div>

      {/* Keywords */}
      <AnimatePresence>
        {keywords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4"
          >
            <p className="mb-2 text-xs text-muted-foreground tracking-widest">
              意象提取
            </p>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, i) => (
                <motion.span
                  key={keyword}
                  variants={charVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{
                    delay: i * 0.08,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-block rounded-md bg-secondary px-3 py-1.5 text-xs text-foreground/80"
                >
                  {keyword}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PoemInput;
