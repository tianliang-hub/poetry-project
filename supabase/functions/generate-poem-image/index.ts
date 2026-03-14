import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const stylePrompts: Record<string, string> = {
  "ink-wash":
    "Traditional Chinese ink wash painting (水墨画) style. Ethereal, misty atmosphere with elegant brushstrokes. Monochrome ink tones with subtle gradations. Minimalist composition with generous negative space. Evocative of Song Dynasty landscape paintings.",
  "gongbi":
    "Traditional Chinese Gongbi (工笔) meticulous painting style. Rich, vibrant colors with fine detailed brushwork. Gold and mineral pigment aesthetics. Intricate patterns and ornamental details. Evocative of Tang Dynasty court paintings.",
  "cinematic":
    "Cinematic photorealistic style inspired by ancient Chinese poetry. Dramatic lighting with volumetric fog. Wide-angle composition with depth of field. Golden hour or moonlit atmosphere. Epic landscape cinematography.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { poem, style, aspectRatio } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!poem || !poem.trim()) {
      return new Response(
        JSON.stringify({ error: "请输入诗词内容" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const styleGuide = stylePrompts[style] || stylePrompts["ink-wash"];

    const prompt = `Generate a beautiful artwork based on this Chinese poem:

"${poem}"

Art style: ${styleGuide}

Aspect ratio: ${aspectRatio || "16:9"}

Important: Create a high-quality artistic interpretation that captures the mood, imagery, and emotion of the poem. The image should be visually stunning and evocative. Do not include any text or characters in the image.`;

    console.log("Generating image for poem:", poem, "style:", style);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "生成请求过于频繁，请稍后再试。" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 额度不足，请充值后再试。" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "图像生成失败，请重试。" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received");

    const imageUrl =
      data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textContent = data.choices?.[0]?.message?.content || "";

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "未能生成图像，请尝试更换诗词或风格。" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl, description: textContent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-poem-image error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
