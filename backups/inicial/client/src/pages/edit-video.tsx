import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useApiSettings } from "@/hooks/use-api-settings";
import { Dropzone } from "@/components/ui/dropzone";

export default function EditVideo() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { apiSettings, isLoading } = useApiSettings();
  
  const [videoData, setVideoData] = useState({
    title: "Meu Vídeo",
    description: "Descrição do vídeo",
    hashtags: "#financas #investimentos #dinheiro",
    videoPath: "",
    thumbnailPath: "",
  });

  const [processing, setProcessing] = useState(false);

  // Verificar se todas as APIs necessárias estão configuradas
  const allApisConfigured = !isLoading && apiSettings?.some(
    api => api.service === "pexels" && api.isActive
  ) && apiSettings?.some(
    api => api.service === "google_tts" && api.isActive
  ) && apiSettings?.some(
    api => api.service === "openai" && api.isActive
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVideoData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileDrop = (files: File[], type: "video" | "thumbnail") => {
    // Em uma implementação real, você enviaria o arquivo para o servidor
    // e receberia um caminho em resposta
    const file = files[0];
    if (file) {
      const path = URL.createObjectURL(file);
      setVideoData(prev => ({ ...prev, [type === "video" ? "videoPath" : "thumbnailPath"]: path }));
      
      toast({
        title: "Arquivo carregado",
        description: `${file.name} foi carregado com sucesso.`,
      });
    }
  };

  const handleSaveVideo = () => {
    setProcessing(true);
    
    // Simulação de API call
    setTimeout(() => {
      setProcessing(false);
      toast({
        title: "Vídeo salvo",
        description: "Seu vídeo foi salvo com sucesso!",
      });
      
      // Redirecionar para a próxima etapa
      setLocation("/schedule-post");
    }, 1500);
  };

  const handleGenerateVideo = () => {
    if (!allApisConfigured) {
      toast({
        title: "APIs não configuradas",
        description: "Você precisa configurar todas as APIs necessárias antes de gerar um vídeo.",
        variant: "destructive",
      });
      return;
    }
    
    setProcessing(true);
    
    // Simulação de API call
    setTimeout(() => {
      setProcessing(false);
      
      // Simular um videoPath gerado
      setVideoData(prev => ({ 
        ...prev, 
        videoPath: "/uploads/test/sample_video.mp4",
        thumbnailPath: "/uploads/test/sample_thumbnail.jpg"
      }));
      
      toast({
        title: "Vídeo gerado",
        description: "Seu vídeo foi gerado com sucesso!",
      });
    }, 2000);
  };

  return (
    <>
      <PageHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edição de Vídeo</h1>
          <p className="text-gray-600">Edite seu vídeo e prepare-o para publicação</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="preview">
              <TabsList className="mb-4">
                <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pré-visualização do vídeo</CardTitle>
                    <CardDescription>Veja como seu vídeo ficará antes de publicá-lo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {videoData.videoPath ? (
                      <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                        <video 
                          src={videoData.videoPath} 
                          controls
                          className="w-full h-full object-contain"
                          poster={videoData.thumbnailPath}
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                        <p className="text-gray-500">Nenhum vídeo disponível</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation("/create-video")}
                    >
                      Voltar
                    </Button>
                    <Button 
                      onClick={handleGenerateVideo}
                      disabled={processing}
                    >
                      {processing ? "Processando..." : "Gerar Vídeo"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes do vídeo</CardTitle>
                    <CardDescription>Defina informações importantes para seu vídeo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Título</label>
                      <Input 
                        name="title"
                        value={videoData.title}
                        onChange={handleInputChange}
                        placeholder="Digite o título do vídeo"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Descrição</label>
                      <Textarea 
                        name="description"
                        value={videoData.description}
                        onChange={handleInputChange}
                        placeholder="Digite uma descrição para o vídeo"
                        rows={4}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hashtags</label>
                      <Input 
                        name="hashtags"
                        value={videoData.hashtags}
                        onChange={handleInputChange}
                        placeholder="#financas #investimentos #dinheiro"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload de arquivos</CardTitle>
                    <CardDescription>Faça upload de seu próprio vídeo e thumbnail</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Vídeo</label>
                      <Dropzone 
                        onDrop={(files) => handleFileDrop(files, "video")}
                        accept={{
                          'video/*': ['.mp4', '.webm', '.mov']
                        }}
                        maxSize={100 * 1024 * 1024} // 100MB
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Thumbnail</label>
                      <Dropzone 
                        onDrop={(files) => handleFileDrop(files, "thumbnail")}
                        accept={{
                          'image/*': ['.jpg', '.jpeg', '.png']
                        }}
                        maxSize={5 * 1024 * 1024} // 5MB
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Publicar vídeo</CardTitle>
                <CardDescription>Revisar e salvar seu vídeo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Detalhes do vídeo</h4>
                  <p className="text-sm text-gray-600 mb-1"><strong>Título:</strong> {videoData.title}</p>
                  <p className="text-sm text-gray-600 mb-1"><strong>Hashtags:</strong> {videoData.hashtags}</p>
                </div>
                
                {videoData.thumbnailPath && (
                  <div>
                    <h4 className="font-medium mb-2">Thumbnail</h4>
                    <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                      <img 
                        src={videoData.thumbnailPath} 
                        alt="Thumbnail" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleSaveVideo}
                  disabled={!videoData.videoPath || processing}
                >
                  {processing ? "Processando..." : "Continuar para Agendamento"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}