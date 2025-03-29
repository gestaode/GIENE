import { useState, useEffect } from "react";
import { VideoPlayer } from "@/components/ui/video-player";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw, Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface VideoPreviewProps {
  media: {
    type: "image" | "video" | "audio";
    url: string;
    source: "pexels" | "upload";
    id?: string | number;
    thumbnail?: string;
  }[];
  videoDetails: {
    title: string;
    description: string;
    tags: string[];
  };
  onVideoGenerated: (videoUrl: string) => void;
}

export function VideoPreview({ media, videoDetails, onVideoGenerated }: VideoPreviewProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>("");
  
  // Simulating video generation process
  const generateVideo = async () => {
    setIsGenerating(true);
    setProgress(0);
    setGenerationStep("Preparando arquivos de mídia...");
    
    try {
      // In a real implementation, we would send the media files to the server
      // and process them using FFmpeg. This is a simplified version.
      
      const images = media.filter(m => m.type === "image");
      const videos = media.filter(m => m.type === "video");
      const audio = media.find(m => m.type === "audio");
      
      // Simulate different steps with delays
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(20);
      setGenerationStep("Processando imagens e vídeos...");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(40);
      setGenerationStep("Combinando mídias...");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(60);
      setGenerationStep("Adicionando áudio...");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(80);
      setGenerationStep("Finalizando vídeo...");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(100);
      
      // If we have a video in the media, use it as our preview
      const previewUrl = videos.length > 0 
        ? videos[0].url 
        : "https://www.w3schools.com/html/mov_bbb.mp4"; // Fallback video
      
      setVideoUrl(previewUrl);
      onVideoGenerated(previewUrl);
      
      toast({
        title: "Vídeo gerado com sucesso!",
        description: "Seu vídeo está pronto para ser publicado ou exportado.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar vídeo",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar seu vídeo.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // Reset state when media changes
    setVideoUrl(null);
    setProgress(0);
  }, [media]);

  return (
    <div className="max-w-4xl mx-auto">
      <h4 className="font-medium text-lg mb-4">Prévia do vídeo</h4>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {videoUrl ? (
                <VideoPlayer 
                  src={videoUrl} 
                  poster={media.find(m => m.type === "image")?.url}
                />
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200">
                  {isGenerating ? (
                    <div className="text-center p-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">{generationStep}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                        <div 
                          className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400">{progress}% concluído</p>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">Clique em "Gerar vídeo" para visualizar a prévia</p>
                      <Button onClick={generateVideo}>
                        Gerar vídeo
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {videoUrl && (
                <div className="flex justify-center space-x-3 mt-4">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={generateVideo}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reprocessar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium text-base mb-4">Detalhes do vídeo</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Título</h4>
                  <p className="text-gray-800">{videoDetails.title}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Descrição</h4>
                  <p className="text-gray-800 text-sm">{videoDetails.description}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {videoDetails.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-800 text-xs font-medium py-1 px-2 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Mídias utilizadas</h4>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">
                      {media.filter(m => m.type === "image").length} imagens
                    </p>
                    <p className="text-xs text-gray-500">
                      {media.filter(m => m.type === "video").length} vídeos
                    </p>
                    <p className="text-xs text-gray-500">
                      {media.filter(m => m.type === "audio").length} áudios
                    </p>
                  </div>
                </div>
              </div>
              
              {!videoUrl && !isGenerating && (
                <Button 
                  className="w-full mt-4"
                  onClick={generateVideo}
                >
                  Gerar vídeo
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
