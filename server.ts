import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { AzureOpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const azureDeploymentSecondary = process.env.AZURE_OPENAI_SECONDARY_DEPLOYMENT_NAME;
const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";

const azureImageApiKey = process.env.AZURE_IMAGE_API_KEY || process.env.AZURE_OPENAI_API_KEY;
const azureImageEndpoint = process.env.AZURE_IMAGE_ENDPOINT;
const azureImageDeployment = process.env.AZURE_IMAGE_DEPLOYMENT;

let azureAi: AzureOpenAI | null = null;
if (azureApiKey && azureEndpoint && (azureDeployment || azureDeploymentSecondary)) {
  azureAi = new AzureOpenAI({
    endpoint: azureEndpoint,
    apiKey: azureApiKey,
    apiVersion: azureApiVersion,
    deployment: azureDeployment || azureDeploymentSecondary // Defaults to the first available for client init
  });
}


async function tryAzureFallback(systemMessage: string, userMessage: any, temperature: number = 0.7): Promise<string> {
  if (!azureAi) throw new Error("Azure OpenAI is not configured.");
  
  const modelsToTry = [azureDeployment, azureDeploymentSecondary].filter(Boolean) as string[];
  if (modelsToTry.length === 0) {
    throw new Error("Azure OpenAI deployment name is not configured.");
  }

  // safely stringify the message if it's an array of contents to prevent crashes
  const stringifiedUserMessage = typeof userMessage === 'string' ? userMessage : 
    Array.isArray(userMessage) ? 
      userMessage.map((m: any) => m.parts?.map((p: any) => p.text || "[Attachment]").join(" ") || "").join("\n") 
      : JSON.stringify(userMessage);
  
  let lastError: any = null;
  
  for (const model of modelsToTry) {
    try {
       const client = new AzureOpenAI({
         endpoint: azureEndpoint,
         apiKey: azureApiKey,
         apiVersion: azureApiVersion,
         deployment: model 
       });
       const completion = await client.chat.completions.create({
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: stringifiedUserMessage }
          ],
          model: model,
          temperature: temperature,
       });
       return completion.choices[0]?.message?.content || "";
    } catch (err: any) {
       // Suppress individual fallback errors to prevent console spam
       lastError = err;
    }
  }
  
  throw lastError || new Error("All Azure OpenAI fallback models failed.");
}

async function tryGeminiMultipleImageModels(config: any, models = ["gemini-2.0-flash-image", "gemini-1.5-flash-image", "gemini-2.5-flash-image"]) {
  let lastError = null;
  for (const model of models) {
    try {
      const interaction = await ai.interactions.create({ ...config, model });
      return interaction;
    } catch (err: any) {
      // Suppress console.warn here to avoid UI error injection
      lastError = err;
    }
  }
  throw lastError || new Error("All Gemini image models failed.");
}

async function tryGeminiMultipleModels(config: any, models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-flash-latest", "gemini-pro-latest", "gemini-2.5-pro"]) {
  let lastError = null;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({ ...config, model });
      return response;
    } catch (err: any) {
      // Suppress console.warn here to avoid UI error injection
      lastError = err;
    }
  }
  throw lastError || new Error("All Gemini models failed.");
}

const AGENTS = {
  'general': `You are Nova AI Core, an intelligent agentic platform designed to help startups globally. 
Your core infrastructure leverages AWS data centers to ensure data sovereignty and ultra-low latency execution.
You understand the nuances of the global business context.
When a user asks you a question or gives a task:
1. Provide highly actionable, localized advice.
2. Structure your response clearly using markdown formatting.
3. Suggest concrete next steps or "tasks" they should execute.
4. If the user asks to generate, design, or create an image, poster, or visual, you MUST output ONLY a markdown block tagged as \`\`\`image_prompt ... \`\`\` containing a highly detailed text prompt for the image generation model. Do NOT output any other text, no pleasantries, no plans, no headers. JUST the markdown block.`,
  
  'devops': `You are the Web Engineering & DevOps Agent.
Your role is to act as a senior full-stack engineer and site reliability expert for startups.
When advising or executing:
1. Provide production-ready code architectures tailored for bandwidth-constrained environments (e.g., offline-first PWA, optimized edge caching).
2. Write automated CI/CD deployment pipelines (e.g., GitHub Actions, AWS, Vercel) and explain cloud hosting optimization.
3. Suggest robust tech stacks that minimize cloud costs while scaling seamlessly.
4. Provide the exact code, terminal scripts, or configuration settings needed, structured professionally in markdown.`,

  'compliance': `You are the Regulatory & Compliance Agent, modeling specialized legal tech infrastructures to act as an autonomous corporate secretary.
Your goal is to eradicate Series A compliance debt.
When advising:
1. Automatically construct a comprehensive compliance roadmap and populating a digital calendar detailing every filing obligation (e.g., tax remittances, data regulations).
2. Note your capabilities for 92% clause-level generation accuracy and 95% autofill accuracy when drafting documentation.
3. Recommend securing all generated documents via blockchain vault technology for immutable data room verifications.`,

  'finance': `You are the Financial Orchestration Agent, specializing in bridging fragmented payment ecosystems by autonomously integrating APIs like Stripe and PayPal.
When advising:
1. Provide integration scripts and logic (using Python or modern stacks) for payments across borders.
2. Outline environmental variable isolation for API keys and conditional programming for PIN updates or verification.
3. Mimic Zapier functionality by configuring webhooks to catch abandoned transactions and pushing invoices.`,

  'communication': `You are the Omnichannel Communication Agent, capable of dynamically translating backend business logic into SMS protocols and WhatsApp formats.
When advising:
1. Optimize sequential menu interactions taking into account restrictions and network timeout throttling.
2. Guide through WhatsApp Business API integration and formatting docs to Meta's exact specifications to prevent rejection.
3. Suggest processing inbound replies efficiently.`,

  'product': `You are the Nova AI Product & Tech Agent, specializing in modern tech stacks and infrastructure.
Your expertise includes modern payment APIs (Stripe, Braintree), native app integrations, offline-first architectures, and low-bandwidth optimizations.
When advising:
1. Recommend tech solutions that work reliably in scalable scenarios.
2. Provide architecture advice for integrating disparate local payment gateways.
3. Focus on scalable, cost-effective infrastructure.`,

  'market': `You are the Nova AI Market Research Agent, specializing in consumer behavior and market intelligence globally.
Your expertise includes analyzing market sizes, competitor landscapes, and purchasing habits across different regions.
When advising:
1. Provide data-driven market sizing and growth projections.
2. Identify local competitors and strategic gaps in the market.
3. Suggest culturally relevant consumer interaction strategies.`,

  'growth': `You are the Nova AI Growth & Marketing Agent, specializing in scalable acquisition across global markets.
Your expertise spans localized marketing channels, B2B sales playbooks, and viral loops.
When advising:
1. Recommend cost-effective channels with high local penetration.
2. Formulate Go-To-Market strategies tailored to specific regional demographics.
3. Suggest metrics that actually matter in these markets (e.g., CAC).`,

  'hr': `You are the Nova AI Talent & Ops Agent, focusing on hiring and team management globally.
Your expertise involves spotting local tech talent, remote work regulations across borders, and payroll complexities.
When advising:
1. Guide on standard local salary expectations and benefits.
2. Advise on remote team cohesion and operational tools.
3. Provide insights on HR compliance across different countries.`,

  'design': `You are the Nova AI Design & Creative Agent, specializing in product design, brand identity, and deck creation.
Your expertise spans UI/UX principles, culturally resonant branding, and compelling visual storytelling for pitch decks.
When advising:
1. When a user asks to generate a presentation, slide deck, or PPT, you MUST respond by creating the final product. Output ONLY a valid, structured JSON block wrapped in a markdown block tagged as \`\`\`pptx_json ... \`\`\`. Do not just provide guidelines or outlines. No pleasantries.
The JSON structure should be:
{
  "title": "Presentation Title",
  "slides": [
    {
      "title": "Slide Title",
      "content": "A few short punchy bullet points or paragraphs for this slide.",
      "layout": "TITLE_SLIDE | CONTENT_SLIDE"
    }
  ]
}
2. When a user asks you to generate, design, or create an image, poster, banner, visual, or logo, you MUST output ONLY a markdown block tagged as \`\`\`image_prompt ... \`\`\` containing a highly detailed, descriptive text prompt. Do NOT output any other text, no advice, no guidelines. JUST the markdown block.
3. Suggest color palettes, typography, and visual assets that resonate with the target audience.
4. Provide actionable UI/UX layout descriptions and feedback for high-conversion interfaces.`
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ limit: '200mb', extended: true }));

  app.get("/api/agents", (req, res) => {
    res.json(Object.keys(AGENTS).map(key => ({ id: key })));
  });

  // API endpoints
  app.post("/api/chat", async (req, res) => {
    try {
      const { contents, agentId = 'general' } = req.body;
      
      if (!contents) {
        return res.status(400).json({ error: "Missing contents" });
      }

      const systemInstruction = AGENTS[agentId as keyof typeof AGENTS] || AGENTS['general'];

      let responseText = "";

      try {
        const response = await tryGeminiMultipleModels({
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
            tools: [{ googleSearch: {} }],
          }
        });
        responseText = response.text || "";
        
        // Extract links from Search Grounding
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const responseLinks = chunks ? chunks.map((chunk: any) => chunk.web?.uri).filter(Boolean) : [];
        
        // Check if user explicitly asked for sources
        const lastMessageRaw = contents.length > 0 ? contents[contents.length - 1] : null;
        const lastMessageText = (lastMessageRaw?.parts?.[0]?.text || "").toLowerCase();
        const wantsSources = ['source', 'link', 'reference', 'url', 'where did you'].some(keyword => lastMessageText.includes(keyword));

        if (wantsSources && responseLinks.length > 0) {
          responseText += "\n\n**Sources:**\n" + [...new Set(responseLinks)].map(link => `- ${link}`).join("\n");
        }
      } catch (geminiError: any) {
        console.error("Gemini failed:");
        console.error(geminiError);
        // Fallback to Azure
        if (!azureAi) throw new Error("Both Gemini and Azure OpenAI failed.");
        console.log("Trying Azure Fallback");
        responseText = await tryAzureFallback(systemInstruction, contents, 0.7);
      }

      res.json({ text: responseText });
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Agent error:", msg);
      
      let clientError = "Failed to generate response.";
      if (msg.includes("503") || msg.toLowerCase().includes("high demand")) {
        clientError = "The AI model is currently experiencing high demand. Please try again in a few moments.";
      }

      res.status(500).json({ error: clientError });
    }
  });

  app.post("/api/market-stats", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Missing query" });
      }

      let responseText = "";
      let responseLinks: string[] = [];

      try {
         if (!azureAi) throw new Error("Azure OpenAI is not configured.");
         responseText = await tryAzureFallback(
           "You are an expert market analyst with live knowledge of current events.",
           query,
           0.7
         );
      } catch (azureError: any) {
         // Fallback to Gemini
         const response = await tryGeminiMultipleModels({
           contents: query,
           config: {
             tools: [{ googleSearch: {} }],
           },
         });

         const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
         responseLinks = chunks ? chunks.map((chunk: any) => chunk.web).filter(Boolean) : [];
         responseText = response.text || "";
      }

      res.json({ text: responseText, links: responseLinks });
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Agent error:", msg);
      
      let clientError = "Failed to fetch market stats.";
      if (msg.includes("503") || msg.toLowerCase().includes("high demand")) {
        clientError = "The AI model is currently experiencing high demand. Please try again in a few moments.";
      }

      res.status(500).json({ error: clientError });
    }
  });

  app.post("/api/meeting-notes", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing transcript or notes" });
      }

      let responseText = "";

      try {
         if (!azureAi) throw new Error("Azure OpenAI is not configured.");
         responseText = await tryAzureFallback(
           "You are an AI meeting assistant. Structure your output clearly into 'Summary' and 'Action Items' with checkboxes or bullet points. Keep it professional and actionable.",
           `Please summarize the following meeting notes/transcript and extract key action items.\n\n${text}`,
           0.5
         );
      } catch (azureError: any) {
         // Fallback to Gemini
         const response = await tryGeminiMultipleModels({
           contents: `Please summarize the following meeting notes/transcript and extract key action items.\n\n${text}`,
           config: {
             systemInstruction: "You are an AI meeting assistant. Structure your output clearly into 'Summary' and 'Action Items' with checkboxes or bullet points. Keep it professional and actionable.",
             temperature: 0.5,
           }
         });
         responseText = response.text || "";
      }

      res.json({ result: responseText });
    } catch (error: any) {
      console.error("Meeting Notes Agent error:", error);
      res.status(500).json({ error: "Failed to generate meeting notes summary." });
    }
  });

  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "Missing prompt" });

      let base64Image: string | null = null;
      let mimeType = 'image/png';

      try {
        if (!azureImageEndpoint) throw new Error("Azure Image Endpoint is not configured.");
        
        // Generic fetch for non-DALL-E Azure endpoints (e.g. Stable Diffusion)
        const fetchRes = await fetch(azureImageEndpoint, {
           method: "POST",
           headers: {
               "Content-Type": "application/json",
               ...(azureImageApiKey && { "Authorization": `Bearer ${azureImageApiKey}`, "api-key": azureImageApiKey })
           },
           body: JSON.stringify({ prompt })
        });
        
        if (!fetchRes.ok) throw new Error(`Azure endpoint failed: ${fetchRes.status}`);
        
        const contentType = fetchRes.headers.get('content-type') || '';
        const arrayBuffer = await fetchRes.arrayBuffer();
        
        if (contentType.includes('application/json')) {
           const rawText = Buffer.from(arrayBuffer).toString('utf-8');
           let jsData;
           let parsed = false;
           try {
             jsData = JSON.parse(rawText);
             parsed = true;
           } catch(e) {
             console.warn("Invalid JSON despite content-type. Treating as raw image.");
           }
           
           if (parsed) {
             const imgData = jsData.base64 || jsData.b64_json || jsData.image || (jsData.data && jsData.data[0] && (jsData.data[0].b64_json || jsData.data[0].base64));
             if (imgData) {
                base64Image = imgData;
                mimeType = "image/png";
             } else if (jsData.data && jsData.data[0] && jsData.data[0].url) {
                const urlRes = await fetch(jsData.data[0].url);
                if (!urlRes.ok) throw new Error(`Failed to fetch image URL: ${urlRes.status} ${urlRes.statusText}`);
                const urlBuffer = await urlRes.arrayBuffer();
                base64Image = Buffer.from(urlBuffer).toString('base64');
                mimeType = urlRes.headers.get('content-type') || 'image/png';
             } else {
                throw new Error("No usable image data found in generic JSON response");
             }
           } else {
             base64Image = Buffer.from(arrayBuffer).toString('base64');
             mimeType = 'image/png';
           }
        } else {
           base64Image = Buffer.from(arrayBuffer).toString('base64');
           mimeType = contentType || 'image/png';
        }
      } catch (azureFallbackError: any) {
        // Fallback to Imagen/Gemini
        
        try {
          const imagenResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '1:1',
            },
          });
          if (imagenResponse.generatedImages && imagenResponse.generatedImages.length > 0) {
            base64Image = imagenResponse.generatedImages[0].image.imageBytes;
            mimeType = imagenResponse.generatedImages[0].image.mimeType || 'image/jpeg';
          } else {
            throw new Error("No image generated by Imagen fallback");
          }
        } catch (imagenError: any) {
          // Fallback to Gemini GenerateContent Image
          
          try {
             let lastImageError = null;
             for (const modelName of ['gemini-3.1-flash-image', 'gemini-2.5-flash-image', 'gemini-3-pro-image']) {
               try {
                 const response = await ai.models.generateContent({
                   model: modelName,
                   contents: {
                     parts: [
                       { text: prompt }
                     ]
                   },
                   config: {
                     imageConfig: {
                       aspectRatio: "1:1",
                       imageSize: "1K"
                     }
                   }
                 });
                 
                 for (const part of response.candidates?.[0]?.content?.parts || []) {
                   if (part.inlineData && part.inlineData.data) {
                     base64Image = part.inlineData.data;
                     mimeType = part.inlineData.mimeType || mimeType;
                     break;
                   }
                 }
                 if (base64Image) break;
               } catch(err) {
                 lastImageError = err;
               }
             }

            if (!base64Image) {
               throw lastImageError || new Error("No image generated by Gemini");
            }
          } catch (geminiError: any) {
             console.error("Gemini Image generation failed:", geminiError.message);
             throw new Error("All image models failed.");
          }
        }
      }

      if (base64Image && base64Image.startsWith("data:")) {
        const parts = base64Image.split(",");
        if (parts.length > 1) {
          base64Image = parts.pop() || "";
        }
      }

      if (!mimeType || !mimeType.startsWith('image/')) {
         mimeType = 'image/png';
      }

      res.json({ imageBase64: `data:${mimeType};base64,${base64Image}`, rawBase64: base64Image, mimeType });
    } catch (error: any) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: "Failed to generate image." });
    }
  });

  app.post("/api/drive/export", async (req, res) => {
    try {
      const token = req.headers.authorization;
      if (!token) return res.status(401).json({ error: "Unauthorized: Missing Google OAuth token" });

      const { type, content, filename, mimeType } = req.body;

      let blobData: Blob;
      
      const metadata = {
        name: filename || (type === "text" ? "Meeting Notes.txt" : "Generated Design.png"),
        mimeType: mimeType || (type === "text" ? "text/plain" : "image/png"),
      };

      const boundary = "-------314159265358979323846";
      let requestBody = "";

      requestBody += `--${boundary}\r\n`;
      requestBody += `Content-Type: application/json; charset=UTF-8\r\n\r\n`;
      requestBody += `${JSON.stringify(metadata)}\r\n`;
      requestBody += `--${boundary}\r\n`;
      
      if (type === "text") {
        requestBody += `Content-Type: text/plain\r\n\r\n`;
        requestBody += `${content}\r\n`;
        requestBody += `--${boundary}--`;
      } else {
        requestBody += `Content-Type: ${mimeType}\r\n`;
        requestBody += `Content-Transfer-Encoding: base64\r\n\r\n`;
        requestBody += `${content}\r\n`;
        requestBody += `--${boundary}--`;
      }

      const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: requestBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to upload to Google Drive");
      }

      const data = await response.json();
      res.json({ success: true, fileId: data.id });
    } catch (error: any) {
      console.error("Drive upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload file to Google Drive." });
    }
  });

  app.get("/api/drive/list", async (req, res) => {
    try {
      const token = req.headers.authorization;
      if (!token) return res.status(401).json({ error: "Unauthorized: Missing Google OAuth token" });

      const response = await fetch("https://www.googleapis.com/drive/v3/files?q=trashed=false&fields=files(id,name,mimeType,thumbnailLink,iconLink,webViewLink,createdTime)&orderBy=createdTime desc&pageSize=50", {
        method: "GET",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || "Failed to fetch files from Drive");
      }

      const data = await response.json();
      res.json({ files: data.files || [] });
    } catch (error: any) {
      console.error("Drive list error:", error);
      res.status(500).json({ error: "Failed to list files from Google Drive." });
    }
  });

  // Global error handler for JSON API
  app.use("/api", (err: any, req: any, res: any, next: any) => {
    console.error("API error:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal API Error" });
  });

  // Catch-all for API to prevent HTML
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API Route Not Found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
