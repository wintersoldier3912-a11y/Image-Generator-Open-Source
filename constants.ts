import { StylePreset, ModelOption } from './types';

export const MODELS: ModelOption[] = [
  { 
    id: 'gemini-2.5-flash-image', 
    name: 'Gemini 2.5 Flash', 
    description: 'Fastest generation, low latency. Good for iteration.', 
    family: 'Flash' 
  },
  { 
    id: 'gemini-3-pro-image-preview', 
    name: 'Gemini 3 Pro', 
    description: 'High fidelity, better instruction following. Slower generation.', 
    family: 'Pro' 
  },
  { 
    id: 'imagen-3.0-generate-001', 
    name: 'Imagen 3', 
    description: 'High photorealism and texture detail. Specialized for image generation.', 
    family: 'Imagen' 
  },
  { 
    id: 'imagen-4.0-generate-001', 
    name: 'Imagen 4 (Preview)', 
    description: 'Next-gen image generation. Highest quality and coherence.', 
    family: 'Imagen' 
  }
];

export const DEFAULT_MODEL_ID = 'gemini-2.5-flash-image';

export const STYLE_PROMPTS: Record<StylePreset, string> = {
  [StylePreset.NONE]: "",
  [StylePreset.PHOTOREALISTIC]: "photorealistic, 8k, highly detailed, professional photography, 85mm lens, sharp focus",
  [StylePreset.ANIME]: "anime style, studio ghibli, vibrant colors, clean lines, high quality illustration",
  [StylePreset.CINEMATIC]: "cinematic lighting, movie scene, dramatic atmosphere, color graded, wide angle, 4k",
  [StylePreset.DIGITAL_ART]: "digital painting, trending on artstation, concept art, smooth, sharp details",
  [StylePreset.PIXEL_ART]: "pixel art, 16-bit, retro game style, dithering",
  [StylePreset.LINE_ART]: "black and white, ink drawing, line art, minimal, clean",
  [StylePreset.FANTASY]: "fantasy art, oil painting style, magical atmosphere, detailed background"
};

export const SAMPLE_PROMPTS = [
  "A futuristic city at sunset with neon lights and flying cars",
  "A cute robot gardening in a greenhouse, soft lighting",
  "Portrait of an astronaut reflecting the galaxy in their helmet visor",
  "Medieval castle on a floating island, waterfalls, eagles flying"
];

export const STORAGE_KEY_HISTORY = 'text2image-open-history-v1';