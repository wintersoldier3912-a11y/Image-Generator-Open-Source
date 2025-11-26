import { GoogleGenAI } from "@google/genai";
import { GenerationSettings, GeneratedImage } from "../types";
import { STYLE_PROMPTS } from "../constants";

// Initialize the API client
// Note: In a real deployment, ensure process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Parses advanced prompt syntax:
 * 1. Weighting: (keyword:weight) -> converts to natural language emphasis
 * 2. Blending: promptA | promptB -> converts to "promptA mixed with promptB"
 */
const parseAdvancedPrompt = (prompt: string): string => {
  // Handle Blending: "cat | dog" -> "cat mixed with dog"
  const segments = prompt.split('|').map(s => s.trim());
  let processedPrompt = segments.join(' mixed with ');

  // Handle Weighting: (keyword:1.5) -> "strongly emphasized keyword"
  // Regex looks for (text:number)
  processedPrompt = processedPrompt.replace(/\(([^:]+):([\d.]+)\)/g, (match, text, weightStr) => {
    const weight = parseFloat(weightStr);
    if (isNaN(weight)) return match;

    if (weight > 1.5) return `extremely emphasized ${text}`;
    if (weight > 1.1) return `strongly emphasized ${text}`;
    if (weight > 1.0) return `emphasized ${text}`;
    if (weight < 0.5) return `faint traces of ${text}`;
    if (weight < 0.9) return `subtle ${text}`;
    return text;
  });

  return processedPrompt;
};

export const generateImage = async (
  settings: GenerationSettings, 
  onProgress?: (percent: number) => void
): Promise<GeneratedImage> => {
  let progressInterval: any = null;

  try {
    // Start Progress Simulation
    // Different models have different expected latencies
    let currentProgress = 0;
    const isFastModel = settings.modelId.includes('flash');
    const increment = isFastModel ? 15 : 5; // Flash is faster
    const maxSimulated = 90; // Don't hit 100% until actually done
    const intervalTime = 400;

    if (onProgress) {
      onProgress(0);
      progressInterval = setInterval(() => {
        currentProgress += increment;
        if (currentProgress > maxSimulated) {
          currentProgress = maxSimulated + (Math.random() * 2); // Add tiny jitter at the end
        }
        onProgress(Math.min(Math.round(currentProgress), 99));
      }, intervalTime);
    }

    // 1. Process Advanced Prompt Syntax
    let refinedPrompt = parseAdvancedPrompt(settings.prompt);

    // 2. Append Style Modifiers
    const styleModifier = STYLE_PROMPTS[settings.stylePreset];
    if (styleModifier) {
      refinedPrompt += `, ${styleModifier}`;
    }

    // 3. Emulate Steps and Guidance Scale effects (since API doesn't expose them directly)
    if (settings.steps && settings.steps > 40) {
      refinedPrompt += ", hyper-detailed, intricate details, maximum quality";
    }
    
    if (settings.guidanceScale) {
      if (settings.guidanceScale > 12) {
        refinedPrompt += ", strictly follow prompt, no deviation";
      } else if (settings.guidanceScale < 5) {
        refinedPrompt += ", creative interpretation, artistic freedom";
      }
    }

    // 4. Append Negative Prompt
    // Note: While some APIs support negativePrompt params, appending it to the text 
    // is a robust cross-model strategy for Gemini and Imagen via this SDK.
    if (settings.negativePrompt) {
      refinedPrompt += `. Exclude: ${settings.negativePrompt}`;
    }

    let base64Data = '';

    // 5. Route based on Model Family
    if (settings.modelId.startsWith('imagen-')) {
      // Use generateImages for Imagen models
      const response = await ai.models.generateImages({
        model: settings.modelId,
        prompt: refinedPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: settings.aspectRatio,
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        base64Data = response.generatedImages[0].image.imageBytes;
      }
    } else {
      // Use generateContent for Gemini models (Flash, Pro, etc.)
      const response = await ai.models.generateContent({
        model: settings.modelId,
        contents: {
          parts: [{ text: refinedPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: settings.aspectRatio,
          }
        },
      });

      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            base64Data = part.inlineData.data;
            break; 
          }
        }
      }
    }

    if (!base64Data) {
      throw new Error("No image data returned from the API.");
    }

    // Clear interval and set to 100%
    if (progressInterval) clearInterval(progressInterval);
    if (onProgress) onProgress(100);

    return {
      id: crypto.randomUUID(),
      base64Data,
      settings,
      timestamp: Date.now(),
      model: settings.modelId
    };

  } catch (error: any) {
    if (progressInterval) clearInterval(progressInterval);
    console.error("Gemini Image Generation Error:", error);
    throw new Error(error.message || "Failed to generate image");
  }
};