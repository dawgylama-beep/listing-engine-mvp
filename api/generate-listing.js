const listingSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "platform",
    "categorySuggestion",
    "title",
    "description",
    "itemDetails",
    "priceStrategy",
    "expectedSellingTimeline",
    "shippingDelivery",
    "stagingPhotos",
    "sellerNotes"
  ],
  properties: {
    platform: { type: "string" },
    categorySuggestion: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    itemDetails: {
      type: "array",
      minItems: 3,
      maxItems: 8,
      items: { type: "string" }
    },
    priceStrategy: { type: "string" },
    expectedSellingTimeline: { type: "string" },
    shippingDelivery: { type: "string" },
    stagingPhotos: { type: "string" },
    sellerNotes: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: { type: "string" }
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = parseBody(req.body);
    const platform = cleanText(body.platform);
    const notes = cleanText(body.notes);
    const photos = Array.isArray(body.photos) ? body.photos : [];

    if (!platform) {
      return res.status(400).json({ error: "Choose a marketplace platform." });
    }

    if (!notes) {
      return res.status(400).json({ error: "Add item notes before generating a listing." });
    }

    if (!photos.length) {
      return res.status(400).json({ error: "Upload at least one item photo." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Missing OPENAI_API_KEY. Add it in your Vercel project environment variables."
      });
    }

    const safePhotos = photos
      .slice(0, 6)
      .filter((photo) => typeof photo.dataUrl === "string" && photo.dataUrl.startsWith("data:image/"))
      .map((photo) => ({
        name: cleanText(photo.name || "Item photo"),
        dataUrl: photo.dataUrl
      }));

    if (!safePhotos.length) {
      return res.status(400).json({ error: "Uploaded photos must be image files." });
    }

    const listing = await generateListingWithOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      platform,
      notes,
      photos: safePhotos
    });

    return res.status(200).json({ listing });
  } catch (error) {
    return res.status(502).json({
      error: error.message || "OpenAI API request failed."
    });
  }
}

async function generateListingWithOpenAI({ apiKey, model, platform, notes, photos }) {
  const userContent = [
    {
      type: "input_text",
      text: [
        `Marketplace platform: ${platform}`,
        `Seller item notes: ${notes}`,
        "",
        "Create a practical marketplace listing. Be specific, honest, and concise.",
        "Do not claim unseen condition details. If something is uncertain from the photos or notes, say what the seller should verify."
      ].join("\n")
    },
    ...photos.map((photo) => ({
      type: "input_image",
      image_url: photo.dataUrl,
      detail: "auto"
    }))
  ];

  const payload = {
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "You are Listing Engine, a careful assistant that turns item photos and seller notes into marketplace listing drafts. Return only the requested structured JSON."
          }
        ]
      },
      {
        role: "user",
        content: userContent
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "marketplace_listing",
        schema: listingSchema,
        strict: true
      }
    }
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error && data.error.message ? data.error.message : "OpenAI API request failed.";
      throw new Error(message);
    }

    const outputText = extractOutputText(data);
    if (!outputText) {
      throw new Error("OpenAI returned an empty response.");
    }

    return JSON.parse(outputText);
  } finally {
    clearTimeout(timeout);
  }
}

function extractOutputText(data) {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseBody(body) {
  if (typeof body === "string") {
    return JSON.parse(body || "{}");
  }

  return body || {};
}
