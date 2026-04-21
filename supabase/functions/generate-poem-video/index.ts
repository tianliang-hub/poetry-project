// Generates 3 cinematic stills representing different "scenes" of the poem.
// Client cross-fades them with Ken Burns motion to create scene-changing video.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STYLE_PROMPTS: Record<string, string> = {
  "ink-wash":
    "traditional Chinese ink wash painting (shuimo), flowing ink, misty mountains, soft brush strokes, monochrome with subtle color, poetic atmosphere",
  "gongbi":
    "Chinese gongbi style, fine detailed brushwork, vibrant mineral colors, elegant lines, classical court painting aesthetic",
  "cinematic":
    "cinematic realistic ancient Chinese landscape, dramatic lighting, atmospheric, film-grade color grading, 4k",
};

// Three "scene beats" that work for most classical poems: establish, intimate, resolve.
const SCENE_BEATS = [
  {
    label: "establishing",
    direction:
      "EXTREME WIDE establishing shot — vast landscape, distant mountains and sky, tiny human or pavilion in scale, dawn or dusk light, wide cinematic composition",
  },
  {
    label: "midground",
    direction:
      "MEDIUM shot — closer view of the central subject (a tree, river bend, lone boat, pavilion, traveler), mid-distance perspective, atmospheric depth, side lighting",
  },
  {
    label: "intimate",
    direction:
      "CLOSE-UP detail — a single evocative element (a branch with petals, ripples on water, a lantern, hand on a brush, falling leaf), shallow depth, intimate mood, golden-hour light",
  },
];

async function generateScene(
  apiKey: string,
  poem: string,
  styleHint: string,
  beat: { label: string; direction: string },
): Promise<string | null> {
  const prompt = `Create a wide cinematic scene inspired by this classical Chinese poem: "${poem}". 
Shot type: ${beat.direction}. 
Style: ${styleHint}. 
No text, no watermarks, no human faces in close-up. Evocative, painterly, suitable as one shot in a 3-shot sequence.`;

  const resp = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
    console.error(`Scene "${beat.label}" failed:`, resp.status, txt);
    if (resp.status === 429 || resp.status === 402) {
      // Bubble up rate-limit / payment errors
      throw { status: resp.status };
    }
    return null;
  }

  const data = await resp.json();
  const url: string | undefined =
    data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  return url ?? null;
}

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

    // Generate 3 scenes in parallel
    const results = await Promise.allSettled(
      SCENE_BEATS.map((beat) =>
        generateScene(LOVABLE_API_KEY, poem, styleHint, beat),
      ),
    );

    // Check for hard errors (rate limit / payment)
    for (const r of results) {
      if (r.status === "rejected") {
        const err = r.reason as { status?: number };
        if (err?.status === 429) {
          return new Response(
            JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        if (err?.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI 额度不足，请前往工作区充值" }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    }

    const scenes = results
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter((url): url is string => Boolean(url));

    if (scenes.length === 0) {
      throw new Error("未能生成任何画面，请重试");
    }

    return new Response(
      JSON.stringify({
        scenes,
        // Backward compatibility
        videoUrl: scenes[0],
        isAnimatedStill: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("generate-poem-video error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
