// Generates a high-quality "cinematic still" via Lovable AI image model.
// Client renders Ken Burns motion + TTS to create the "video" experience.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STYLE_PROMPTS: Record<string, string> = {
  "ink-wash":
    "traditional Chinese ink wash painting (shuimo), flowing ink, misty mountains, soft brush strokes, monochrome with subtle color, poetic atmosphere, cinematic wide composition",
  "gongbi":
    "Chinese gongbi style, fine detailed brushwork, vibrant mineral colors, elegant lines, classical court painting aesthetic, cinematic wide composition",
  "cinematic":
    "cinematic realistic ancient Chinese landscape, dramatic lighting, atmospheric, film-grade color grading, 4k, ultra wide composition",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { poem, style = "ink-wash" } = await req.json();
    if (!poem || typeof poem !== "string") {
      return new Response(JSON.stringify({ error: "缺少诗词内容" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY 未配置");

    const styleHint = STYLE_PROMPTS[style] ?? STYLE_PROMPTS["ink-wash"];
    const prompt = `Create a wide cinematic scene inspired by this classical Chinese poem: "${poem}". Style: ${styleHint}. Rich depth, layered foreground/midground/background, no text, no human faces, evocative mood suitable for a slow camera pan.`;

    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      },
    );

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Image gen failed:", resp.status, txt);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI 额度不足，请前往工作区充值" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`图像生成失败: ${resp.status}`);
    }

    const data = await resp.json();
    const imageUrl: string | undefined =
      data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("未能获取生成的画面");
    }

    return new Response(JSON.stringify({ videoUrl: imageUrl, isAnimatedStill: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-poem-video error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
