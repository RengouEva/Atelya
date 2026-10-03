/* Test : le SDK supporte-t-il la vision (image en entrée du chat) ? */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

const IMG = "/home/z/my-project/public/ai/pieces-ia.png";

const b64 = fs.readFileSync(IMG).toString("base64");

async function main() {
  const zai = await ZAI.create();

  // Tentative 1 : format multimodal (content en tableau)
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Décris cette image en 2 phrases, puis réponds en JSON : {\"type\":\"...\",\"couleur\":\"...\"}",
            },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${b64}` },
            },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });
    console.log("VISION-ARRAY OK:");
    console.log(completion.choices[0]?.message?.content?.slice(0, 500));
  } catch (e) {
    console.log("VISION-ARRAY FAILED:", e instanceof Error ? e.message : e);
  }
}

main();
