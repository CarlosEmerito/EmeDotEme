import 'dotenv/config';
// ... (resto de la lógica igual que en el archivo original)

// Configuración de AI Horde API
const AI_HORDE_API_KEY = process.env.AI_HORDE_API_KEY || "te_N7fz_XZR6OydOwLLL0w";
const AI_HORDE_BASE_URL = "https://aihorde.net/api/v2";

// Models to priorizar...
// ...

export interface AIHordeImageOptions {
  // ...
}

export interface AIHordeGenerationStatus {
  // ...
}

export interface AIHordeAsyncRequest {
  // ...
}

export async function generateImageWithAIHorde(
  prompt: string,
  articleSlug: string,
  options: AIHordeImageOptions = {}
): Promise<string | null> {
  // ...
}
