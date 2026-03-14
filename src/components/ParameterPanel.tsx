import { forwardRef } from "react";

interface ParameterPanelProps {
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
}

const ratios = ["1:1", "4:3", "16:9", "9:16", "3:4"];

const ParameterPanel = forwardRef<HTMLDivElement, ParameterPanelProps>(
  ({ aspectRatio, onAspectRatioChange }, ref) => {
    return (
      <div ref={ref} className="mt-4 space-y-6 pb-4">
        <div>
          <p className="mb-2 text-xs text-muted-foreground tracking-widest">画面比例</p>
          <div className="flex gap-2">
            {ratios.map((r) => (
              <button
                key={r}
                onClick={() => onAspectRatioChange(r)}
                className={`rounded-md px-3 py-1.5 text-xs transition-all duration-200 ${
                  aspectRatio === r
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-muted-foreground tracking-widest">种子值</p>
          <input
            type="number"
            placeholder="随机"
            className="w-full border-b border-border bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-muted-foreground focus:outline-none transition-colors"
          />
        </div>
      </div>
    );
  }
);

ParameterPanel.displayName = "ParameterPanel";

export default ParameterPanel;
