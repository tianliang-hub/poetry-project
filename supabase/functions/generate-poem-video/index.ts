// Generates a 5s video from a Chinese poem using Lovable AI video model.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STYLE_PROMPTS: Record<string, string> = {
  "ink-wash":
    "traditional Chinese ink wash painting (shuimo) animation, flowing ink, misty mountains, soft brush strokes, monochrome with subtle color, poetic atmosphere",
  "gongbi":
    "Chinese gongbi style animation, fine detailed brushwork, vibrant mineral colors, elegant lines, classical court painting aesthetic",
  "cinematic":
    "cinematic realistic ancient Chinese landscape, dramatic lighting, slow camera movement, atmospheric, film-grade color grading, 4k",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { poem, style = "ink-wash", aspectRatio = "16:9" } = await req.json();
    if (!poem || typeof poem !== "string") {
      return new Response(JSON.stringify({ error: "缺少诗词内容" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY 未配置");

    const styleHint = STYLE_PROMPTS[style] ?? STYLE_PROMPTS["ink-wash"];
    const prompt = `Animate a scene inspired by this classical Chinese poem: "${poem}". Style: ${styleHint}. Gentle natural motion (drifting clouds, flowing water, swaying branches, falling petals), slow cinematic camera, no text, no people faces, poetic mood.`;

    // Submit video generation job to Lovable AI Gateway
    const submitResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/videos/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/veo-3-fast",
          prompt,
          aspect_ratio: aspectRatio,
          duration_seconds: 5,
        }),
      },
    );

    if (!submitResp.ok) {
      const txt = await submitResp.text();
      console.error("Video submit failed:", submitResp.status, txt);
      if (submitResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (submitResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 额度不足，请前往工作区充值" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`视频任务提交失败: ${submitResp.status}`);
    }

    const submitData = await submitResp.json();
    const jobId: string | undefined = submitData.id || submitData.job_id;
    let videoUrl: string | undefined =
      submitData.video_url ||
      submitData.url ||
      submitData.output?.[0]?.url ||
      submitData.data?.[0]?.url;

    // Poll for completion if not immediate
    if (!videoUrl && jobId) {
      const start = Date.now();
      const TIMEOUT_MS = 110_000;
      while (Date.now() - start < TIMEOUT_MS) {
        await new Promise((r) => setTimeout(r, 4000));
        const pollResp = await fetch(
          `https://ai.gateway.lovable.dev/v1/videos/generations/${jobId}`,
          { headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` } },
        );
        if (!pollResp.ok) {
          const t = await pollResp.text();
          console.error("Poll failed:", pollResp.status, t);
          continue;
        }
        const pd = await pollResp.json();
        const status = pd.status || pd.state;
        videoUrl =
          pd.video_url ||
          pd.url ||
          pd.output?.[0]?.url ||
          pd.data?.[0]?.url;
        if (videoUrl) break;
        if (status === "failed" || status === "error") {
          throw new Error(pd.error?.message || "视频生成失败");
        }
      }
    }

    if (!videoUrl) {
      throw new Error("视频生成超时，请稍后重试");
    }

    return new Response(JSON.stringify({ videoUrl }), {
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
