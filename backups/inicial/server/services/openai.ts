import OpenAI from "openai";
import { log } from "../vite";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

interface ScriptGenerationOptions {
  theme: string;
  targetAudience?: string;
  duration?: number;
  tone?: string;
  keywords?: string[];
  additionalInstructions?: string;
}

interface ContentGenerationOptions {
  title?: boolean;
  description?: boolean;
  hashtags?: boolean;
  count?: number;
}

interface GeneratedScript {
  title: string;
  introduction: string;
  mainPoints: string[];
  conclusion: string;
  fullScript: string;
}

interface GeneratedContent {
  title?: string;
  description?: string;
  hashtags?: string[];
}

export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate a video script based on theme and options
   */
  async generateVideoScript(options: ScriptGenerationOptions): Promise<GeneratedScript> {
    try {
      const {
        theme,
        targetAudience = "general",
        duration = 60,
        tone = "informative",
        keywords = [],
        additionalInstructions = "",
      } = options;

      const prompt = `Create a concise script for a ${duration}-second social media video about "${theme}" for ${targetAudience} audience.
      Tone should be ${tone}.
      Include these keywords if possible: ${keywords.join(", ")}.
      ${additionalInstructions}
      
      Respond with JSON in this format:
      {
        "title": "Catchy title for the video",
        "introduction": "Opening hook (5-8 seconds)",
        "mainPoints": ["Key point 1 (10-15 seconds)", "Key point 2 (10-15 seconds)", "Key point 3 (10-15 seconds)"],
        "conclusion": "Closing statement with call to action (5-8 seconds)",
        "fullScript": "The complete script combining all sections"
      }`;

      const response = await this.openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "You are an expert video script writer for short-form social media content." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content) as GeneratedScript;
      return result;
    } catch (error) {
      log(`Error generating video script: ${error instanceof Error ? error.message : String(error)}`, 'openai');
      throw error;
    }
  }

  /**
   * Generate content for social media post (titles, descriptions, hashtags)
   */
  async generateSocialMediaContent(
    theme: string,
    script: string,
    options: ContentGenerationOptions = {}
  ): Promise<GeneratedContent> {
    try {
      const {
        title = true,
        description = true,
        hashtags = true,
        count = 5,
      } = options;

      const prompt = `Create social media content for a video about "${theme}" with the following script:
      
      "${script.substring(0, 500)}..."
      
      Respond with JSON in this format:
      {
        ${title ? '"title": "Catchy title for the video (max 60 chars)",' : ''}
        ${description ? '"description": "Engaging description for social media (max 200 chars)",' : ''}
        ${hashtags ? `"hashtags": ["hashtag1", "hashtag2", ... up to ${count} relevant hashtags]` : ''}
      }`;

      const response = await this.openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "You are an expert social media content creator specializing in engaging captions and hashtags." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content) as GeneratedContent;
      return result;
    } catch (error) {
      log(`Error generating social media content: ${error instanceof Error ? error.message : String(error)}`, 'openai');
      throw error;
    }
  }

  /**
   * Suggest trending topics based on a theme
   */
  async suggestTrendingTopics(theme: string, count: number = 5): Promise<string[]> {
    try {
      const prompt = `Suggest ${count} trending and engaging topic ideas for social media videos about "${theme}".
      
      Respond with a JSON array of strings like this:
      ["Topic idea 1", "Topic idea 2", ...]`;

      const response = await this.openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "You are an expert in social media trends and content strategy." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      log(`Error suggesting trending topics: ${error instanceof Error ? error.message : String(error)}`, 'openai');
      throw error;
    }
  }
}
