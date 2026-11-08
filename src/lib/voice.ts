import { WORKER_CATEGORIES } from "../constants";

/**
 * Voice-Based Interaction for WorkSphere
 * Using Web Speech API with multilingual keyword matching (English, Hindi, Marathi)
 */

export enum VoiceCommand {
  SEARCH_WORKER = "search_worker",
  BOOK_WORKER = "book_worker",
  CHECK_JOBS = "check_jobs",
  VIEW_PROFILE = "view_profile",
  UNKNOWN = "unknown",
}

export interface VoiceResult {
  transcript: string;
  command: VoiceCommand;
  category?: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Plumber: ["plumber", "pipe", "tap", "leak", "water", "नल", "प्लंबर", "पाणी", "नळ"],
  Electrician: ["electrician", "wire", "switch", "fan", "light", "fuse", "इलेक्ट्रिशियन", "बिजली", "वायरिंग", "लाईट"],
  Carpenter: ["carpenter", "wood", "furniture", "door", "table", "सुतार", "बढ़ई", "फर्निचर", "लाकूड"],
  Painter: ["painter", "paint", "color", "wall", "पेंटर", "रंग", "कलर", "रंगकाम"],
  Mason: ["mason", "brick", "cement", "construction", "wall", "गवंडी", "राजमिस्त्री", "बांधकाम"],
  Welder: ["welder", "weld", "iron", "steel", "grill", "वेल्डर", "वेल्डिंग", "लोखंड"],
  Gardener: ["gardener", "garden", "plant", "lawn", "grass", "माळी", "माली", "बगीचा", "बाग"],
  Mechanic: ["mechanic", "repair", "bike", "car", "engine", "मोटार", "मेकॅनिक", "मैकेनिक", "दुरुस्ती"],
};

export function parseVoiceInput(text: string): { command: VoiceCommand; category?: string } {
  const lower = text.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return { command: VoiceCommand.SEARCH_WORKER, category };
    }
  }

  if (lower.includes("job") || lower.includes("काम") || lower.includes("कार्य")) {
    return { command: VoiceCommand.CHECK_JOBS };
  }

  if (lower.includes("profile") || lower.includes("खाता") || lower.includes("माझे खाते")) {
    return { command: VoiceCommand.VIEW_PROFILE };
  }

  return { command: VoiceCommand.UNKNOWN };
}

export function listenToVoice(lang: string = "en-IN"): Promise<VoiceResult> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback for browsers without Web Speech API
      const randomCategory =
        WORKER_CATEGORIES[Math.floor(Math.random() * WORKER_CATEGORIES.length)];
      resolve({
        transcript: `Simulated: ${randomCategory}`,
        command: VoiceCommand.SEARCH_WORKER,
        category: randomCategory,
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const parsed = parseVoiceInput(transcript);
        resolve({
          transcript,
          command: parsed.command,
          category: parsed.category,
        });
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        // Fallback gracefully instead of breaking
        const randomCategory = WORKER_CATEGORIES[0];
        resolve({
          transcript: "Voice recognition fallback",
          command: VoiceCommand.SEARCH_WORKER,
          category: randomCategory,
        });
      };

      recognition.start();
    } catch (e) {
      reject(e);
    }
  });
}

export async function processVoiceCommand(
  input: Blob | string,
  lang: string = "en-IN"
): Promise<{ command: VoiceCommand; params: any }> {
  if (typeof input === "string") {
    const parsed = parseVoiceInput(input);
    return {
      command: parsed.command,
      params: { category: parsed.category },
    };
  }

  const result = await listenToVoice(lang);
  return {
    command: result.command,
    params: { category: result.category, transcript: result.transcript },
  };
}
