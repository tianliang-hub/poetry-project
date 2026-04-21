// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGEN_MODEL = "imagen-3.0-generate-002";
const IMAGEN_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict`;
const FALLBACK_GEMINI_API_KEY = "AIzaSyASuz3D-Ku4ApZQXZWoAlzcs7uNfZkMv5Y";

const stylePrompts: Record<string, string> = {
  "ink-wash":
    "Traditional Chinese ink wash painting (水墨画) style. Ethereal, misty atmosphere with elegant brushstrokes. Monochrome ink tones with subtle gradations. Minimalist composition with generous negative space. Evocative of Song Dynasty landscape paintings.",
  "gongbi":
    "Traditional Chinese Gongbi (工笔) meticulous painting style. Rich, vibrant colors with fine detailed brushwork. Gold and mineral pigment aesthetics. Intricate patterns and ornamental details. Evocative of Tang Dynasty court paintings.",
  "cinematic":
    "Cinematic photorealistic style inspired by ancient Chinese poetry. Dramatic lighting with volumetric fog. Wide-angle composition with depth of field. Golden hour or moonlit atmosphere. Epic landscape cinematography.",
};

const SUPPORTED_ASPECT_RATIOS = new Set(["1:1", "3:4", "4:3", "9:16", "16:9"]);

const normalizeAspectRatio = (ratio?: string): string =>
  SUPPORTED_ASPECT_RATIOS.has(ratio ?? "") ? (ratio as string) : "16:9";

const isQuotaError = (status: number, text: string) => {
  if (status === 402 || status === 403 || status === 429) return true;
  const message = text.toLowerCase();
  return (
    message.includes("quota") ||
    message.includes("billing") ||
    message.includes("insufficient") ||
    message.includes("resource exhausted")
  );
};

const extractBase64Image = (data: any): string | null => {
  const first = data?.predictions?.[0];
  const bytes =
    first?.bytesBase64Encoded ??
    first?.image?.bytesBase64Encoded ??
    first?.b64_json ??
    null;
  return typeof bytes === "string" && bytes.trim().length > 0 ? bytes : null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { poem, style, aspectRatio } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY") || FALLBACK_GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const poemText = typeof poem === "string" ? poem.trim() : "";
    if (!poemText) {
      return new Response(JSON.stringify({ error: "请输入诗词内容" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const styleGuide = stylePrompts[style] || stylePrompts["ink-wash"];
    const finalAspectRatio = normalizeAspectRatio(aspectRatio);
    const prompt = `Generate a high-quality Chinese-poetry artwork.

Poem:
"${poemText}"

Style direction:
${styleGuide}

Requirements:
- Aspect ratio ${finalAspectRatio}
- No text, no watermark, no UI elements
- Focus on mood, imagery, and emotional tone of the poem`;

    const response = await fetch(`${IMAGEN_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: finalAspectRatio,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Imagen API error:", response.status, errText);

      if (isQuotaError(response.status, errText)) {
        return new Response(
          JSON.stringify({ error: "Gemini/Imagen 额度不足或达到配额上限，请检查计费与限额。" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({ error: "图像生成失败，请稍后重试。" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const imageBase64 = extractBase64Image(data);
    if (!imageBase64) {
      console.error("Imagen response missing image:", JSON.stringify(data).slice(0, 800));
      return new Response(JSON.stringify({ error: "未能生成图像，请重试。" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        imageUrl: `data:image/png;base64,${imageBase64}`,
        description: "",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-poem-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
