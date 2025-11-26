export enum AspectRatio {
  SQUARE = "1:1",
  LANDSCAPE = "16:9",
  PORTRAIT = "9:16",
  CLASSIC_LANDSCAPE = "4:3",
  CLASSIC_PORTRAIT = "3:4"
}

export enum StylePreset {
  NONE = "None",
  PHOTOREALISTIC = "Photorealistic",
  ANIME = "Anime",
  CINEMATIC = "Cinematic",
  DIGITAL_ART = "Digital Art",
  PIXEL_ART = "Pixel Art",
  LINE_ART = "Line Art",
  FANTASY = "Fantasy"
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  family: string;
}

export interface GenerationSettings {
  prompt: string;
  negativePrompt: string;
  aspectRatio: AspectRatio;
  stylePreset: StylePreset;
  modelId: string;
  seed?: number;
  steps?: number;
  guidanceScale?: number;
}

export interface GeneratedImage {
  id: string;
  base64Data: string;
  settings: GenerationSettings;
  timestamp: number;
  model: string;
}

export interface HistoryItem extends GeneratedImage {
  isFavorite?: boolean;
}