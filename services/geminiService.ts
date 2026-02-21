
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionType } from "../types";

// Debug log to check if key is loaded (do not log the actual key)
console.log('API Key loaded:', !!process.env.API_KEY);

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  generateFormStructure: async (topic: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Generate a feedback form structure for: ${topic}. Include a title, description, and exactly 5 relevant questions with types (TEXT, RATING, MULTIPLE_CHOICE, YES_NO).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    type: { type: Type.STRING, enum: Object.values(QuestionType) },
                    required: { type: Type.BOOLEAN },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["label", "type", "required"]
                }
              }
            },
            required: ["title", "description", "questions"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Empty response from AI");
      }
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini API Error details:", error);
      throw error;
    }
  },

  summarizeFeedback: async (formTitle: string, questionsAndAnswers: any[]) => {
    const content = `Summarize the following feedback for the event "${formTitle}". Identify key strengths, weaknesses, and a sentiment score (0-100).
    
    Data:
    ${JSON.stringify(questionsAndAnswers)}
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: content,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              sentimentScore: { type: Type.NUMBER }
            },
            required: ["summary", "strengths", "weaknesses", "sentimentScore"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Empty response from AI");
      }
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini Summarize Error details:", error);
      throw error;
    }
  }
};
