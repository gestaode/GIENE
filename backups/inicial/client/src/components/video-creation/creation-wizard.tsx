import { useState } from "react";
import { Stepper } from "./stepper";
import { ThemeSelector } from "./theme-selector";
import { ContentForm } from "./content-form";
import { MediaSelector } from "./media-selector";
import { VideoPreview } from "./video-preview";
import { PublishOptions } from "./publish-options";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useVideoCreation } from "@/hooks/use-video-creation";

type Step = "theme" | "content" | "media" | "preview" | "publish";

export function CreationWizard() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>("theme");
  const {
    theme,
    setTheme,
    content,
    setContent,
    media,
    setMedia,
    videoUrl,
    setVideoUrl,
    resetState
  } = useVideoCreation();
  
  const steps = [
    { id: "theme", label: "Tema" },
    { id: "content", label: "Conteúdo" },
    { id: "media", label: "Mídia" },
    { id: "preview", label: "Prévia" },
    { id: "publish", label: "Publicação" },
  ];
  
  const createVideoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/videos", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vídeo salvo com sucesso",
        description: "Seu vídeo foi criado e salvo em sua biblioteca."
      });
      resetState();
      setCurrentStep("theme");
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar vídeo",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar seu vídeo.",
        variant: "destructive"
      });
    }
  });
  
  const handleNextStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as Step);
    }
  };
  
  const handlePreviousStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as Step);
    }
  };
  
  const handleSelectTheme = (selectedTheme: string) => {
    setTheme(selectedTheme);
    handleNextStep();
  };
  
  const handleContentGenerated = (generatedContent: any) => {
    setContent(generatedContent);
    handleNextStep();
  };
  
  const handleMediaSelected = (selectedMedia: any) => {
    setMedia(selectedMedia);
    handleNextStep();
  };
  
  const handleVideoGenerated = (generatedVideoUrl: string) => {
    setVideoUrl(generatedVideoUrl);
  };
  
  const handlePublish = (publishData: any) => {
    // Combine all the data and save the video
    const videoData = {
      userId: 1, // Demo user ID
      title: publishData.title,
      description: publishData.description,
      tags: publishData.tags,
      status: publishData.publishDate ? "scheduled" : "published",
      theme: theme,
      thumbnailUrl: media.find(m => m.type === "image")?.url,
      videoUrl: videoUrl,
      scheduledAt: publishData.publishDate,
      platform: publishData.platforms,
      scriptContent: content.script,
      mediaRefs: media.map(m => m.url),
    };
    
    createVideoMutation.mutate(videoData);
  };
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "theme":
        return <ThemeSelector selectedTheme={theme} onThemeSelect={handleSelectTheme} />;
      case "content":
        return <ContentForm theme={theme} onContentGenerated={handleContentGenerated} />;
      case "media":
        return <MediaSelector script={content.script} onSelectMedia={handleMediaSelected} />;
      case "preview":
        return (
          <VideoPreview 
            media={media} 
            videoDetails={content} 
            onVideoGenerated={handleVideoGenerated} 
          />
        );
      case "publish":
        return (
          <PublishOptions 
            videoUrl={videoUrl || ""} 
            videoDetails={content} 
            onPublish={handlePublish}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <Stepper steps={steps} currentStep={currentStep} />
      
      <div>
        {renderCurrentStep()}
      </div>
      
      {currentStep !== "theme" && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePreviousStep}>
            Voltar
          </Button>
          
          {currentStep !== "publish" && (
            <Button 
              onClick={handleNextStep} 
              disabled={
                (currentStep === "content" && !content.title) ||
                (currentStep === "media" && media.length === 0) ||
                (currentStep === "preview" && !videoUrl)
              }
            >
              Próximo
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
