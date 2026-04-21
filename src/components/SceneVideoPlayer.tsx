import { useEffect, useState } from "react";

interface SceneVideoPlayerProps {
  scenes: string[];
  poem: string;
  /** Seconds per scene before crossfading to the next */
  sceneDuration?: number;
}

/**
 * Cross-fades through multiple AI-generated stills with Ken Burns motion
 * to simulate a multi-shot cinematic sequence.
 */
const SceneVideoPlayer = ({
  scenes,
  poem,
  sceneDuration = 4,
}: SceneVideoPlayerProps) => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (scenes.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % scenes.length);
    }, sceneDuration * 1000);
    return () => window.clearInterval(id);
  }, [scenes.length, sceneDuration]);

  return (
    <div className="relative w-full aspect-video overflow-hidden bg-black/40">
      {scenes.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt={`Scene ${i + 1} for: ${poem}`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
            i === activeIdx ? "opacity-100 ken-burns" : "opacity-0"
          } ${i % 2 === 1 ? "ken-burns-alt" : ""}`}
        />
      ))}

      {/* Scene indicator dots */}
      {scenes.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {scenes.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === activeIdx ? "w-6 bg-foreground/80" : "w-1.5 bg-foreground/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SceneVideoPlayer;
