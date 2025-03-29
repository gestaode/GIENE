import { useState, useCallback } from "react";

interface VideoContent {
  title: string;
  script: string;
  description: string;
  tags: string[];
}

interface VideoMedia {
  type: "image" | "video" | "audio";
  url: string;
  source: "pexels" | "upload";
  id?: string | number;
  thumbnail?: string;
}

export function useVideoCreation() {
  const [theme, setTheme] = useState<string>("");
  const [content, setContent] = useState<VideoContent>({
    title: "",
    script: "",
    description: "",
    tags: [],
  });
  const [media, setMedia] = useState<VideoMedia[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setTheme("");
    setContent({
      title: "",
      script: "",
      description: "",
      tags: [],
    });
    setMedia([]);
    setVideoUrl(null);
  }, []);

  const hasCompletedStep = useCallback((stepName: string) => {
    switch (stepName) {
      case "theme":
        return !!theme;
      case "content":
        return !!content.title && !!content.script;
      case "media":
        return media.length > 0;
      case "preview":
        return !!videoUrl;
      default:
        return false;
    }
  }, [theme, content, media, videoUrl]);

  return {
    theme,
    setTheme,
    content,
    setContent,
    media,
    setMedia,
    videoUrl,
    setVideoUrl,
    resetState,
    hasCompletedStep,
  };
}
