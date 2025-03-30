import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ThemeSelector } from "@/components/video-creation/theme-selector";
import { ContentForm } from "@/components/video-creation/content-form";
import { MediaSelector } from "@/components/video-creation/media-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Video, FileVideo, ImagePlus, FileText } from "lucide-react";

export default function CreateVideo() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("theme");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState("");
  const [content, setContent] = useState<any>({});
  const [media, setMedia] = useState<any[]>([]);
  
  // Criação do vídeo
  const createVideoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/videos", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Vídeo criado com sucesso",
        description: "Agora você pode editar e aprimorar seu vídeo."
      });
      // Redirecionar para a página de edição
      setLocation(`/edit-video/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar vídeo",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar seu vídeo.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  });
  
  const handleSelectTheme = (selectedTheme: string) => {
    setTheme(selectedTheme);
    setActiveTab("content");
  };
  
  const handleContentGenerated = (generatedContent: any) => {
    setContent(generatedContent);
    setActiveTab("media");
  };
  
  const handleMediaSelected = (selectedMedia: any) => {
    setMedia(selectedMedia);
  };
  
  const handleCreateVideo = () => {
    if (!theme || !content.script || media.length === 0) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, preencha todas as informações antes de criar o vídeo.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    // Preparar os dados do vídeo
    const videoData = {
      userId: 1, // Demo user ID
      title: content.title || "Vídeo sem título",
      description: content.summary || "",
      tags: content.keywords || [],
      status: "draft",
      theme: theme,
      thumbnailUrl: media.find(m => m.type === "image")?.url || null,
      videoUrl: null, // Será gerado na etapa de edição
      scriptContent: content.script,
      mediaRefs: media.map(m => m.url),
    };
    
    createVideoMutation.mutate(videoData);
  };
  
  const isCreateDisabled = !theme || !content.script || media.length === 0 || isLoading;
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Criação de Vídeo</h1>
          <p className="text-muted-foreground">Crie o conteúdo do seu vídeo em etapas simples</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setLocation('/')}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateVideo}
            disabled={isCreateDisabled}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar e Editar Vídeo
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Informações do Vídeo</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="theme">
                <FileText className="h-4 w-4 mr-2" /> 
                1. Tema
              </TabsTrigger>
              <TabsTrigger value="content" disabled={!theme}>
                <FileText className="h-4 w-4 mr-2" /> 
                2. Conteúdo
              </TabsTrigger>
              <TabsTrigger value="media" disabled={!content.script}>
                <ImagePlus className="h-4 w-4 mr-2" /> 
                3. Mídia
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="theme">
              <ThemeSelector selectedTheme={theme} onThemeSelect={handleSelectTheme} />
              
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => theme && setActiveTab("content")}
                  disabled={!theme}
                >
                  Próximo: Conteúdo
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="content">
              <ContentForm theme={theme} onContentGenerated={handleContentGenerated} />
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setActiveTab("theme")}>
                  Voltar
                </Button>
                <Button 
                  onClick={() => content.script && setActiveTab("media")}
                  disabled={!content.script}
                >
                  Próximo: Mídia
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="media">
              <MediaSelector 
                script={content.script || ""} 
                onSelectMedia={handleMediaSelected}
              />
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setActiveTab("content")}>
                  Voltar
                </Button>
                <Button 
                  onClick={handleCreateVideo}
                  disabled={isCreateDisabled}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar e Editar Vídeo
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Status do Progresso */}
      <Card className="mt-6">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Status de Criação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${theme ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                {theme ? '✓' : '1'}
              </div>
              <div className="flex-1">
                <p className={theme ? 'font-medium' : 'text-muted-foreground'}>Tema</p>
                <p className="text-xs text-muted-foreground">
                  {theme ? `Tema selecionado: ${theme}` : 'Selecione um tema para o vídeo'}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${content.script ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                {content.script ? '✓' : '2'}
              </div>
              <div className="flex-1">
                <p className={content.script ? 'font-medium' : 'text-muted-foreground'}>Conteúdo</p>
                <p className="text-xs text-muted-foreground">
                  {content.script ? 'Conteúdo gerado com sucesso' : 'Gere o roteiro e conteúdo do vídeo'}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${media.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                {media.length > 0 ? '✓' : '3'}
              </div>
              <div className="flex-1">
                <p className={media.length > 0 ? 'font-medium' : 'text-muted-foreground'}>Mídia</p>
                <p className="text-xs text-muted-foreground">
                  {media.length > 0 ? `${media.length} itens selecionados` : 'Selecione imagens e vídeos'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
