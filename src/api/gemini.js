import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";

const safetySetting = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
];

const genAI = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_PUBLIC_KEY,
});

export function startChat({ history = [], generationConfig = {} }) {
  return {
    async sendMessageStream(messages) {
      const contents = messages.map((msg) => {
        if (typeof msg === "string") {
          return { text: msg };
        } else if (msg.base64 && msg.mimeType) {
          return {
            inlineData: {
              data: msg.base64,
              mimeType: msg.mimeType,
            },
          };
        }

        return { text: JSON.stringify(msg) };
      });

      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        safetySettings: safetySetting,
        ...generationConfig,
      });

      return {
        stream: (async function* () {
          yield {
            text: () => response.text,
          };
        })(),
      };
    },
  };
}
