import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

const TestAdvancedVideo = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Configurações básicas
  const [outputFileName, setOutputFileName] = useState(`test_video_${Date.now()}.mp4`);
  const [imagePaths, setImagePaths] = useState<string[]>([
    "/uploads/test/image1.jpg",
    "/uploads/test/image2.jpg",
    "/uploads/test/image3.jpg",
  ]);
  const [text, setText] = useState("Texto de demonstração para o vídeo");
  const [duration, setDuration] = useState(3);
  
  // Estilo e Animação
  const [transition, setTransition] = useState("fade");
  const [transitionDuration, setTransitionDuration] = useState(0.5);
  const [textPosition, setTextPosition] = useState("bottom");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textAnimation, setTextAnimation] = useState("none");
  const [colorGrading, setColorGrading] = useState("vibrant");
  
  // Recursos avançados
  const [zoomEffect, setZoomEffect] = useState(true);
  const [autoSubtitle, setAutoSubtitle] = useState(false);
  const [watermark, setWatermark] = useState("");
  const [outputQuality, setOutputQuality] = useState("high");
  const [social, setSocial] = useState("tiktok");

  // Esta função configura imagens para o teste de vídeo
  const handleTestImages = () => {
    // Definimos o caminho absoluto para as imagens de teste
    const testImages = [
      "uploads/test/image1.jpg",
      "uploads/test/image2.jpg", 
      "uploads/test/image3.jpg",
    ];
    
    setImagePaths(testImages);
    
    toast({
      title: "Imagens de teste definidas",
      description: "Imagens carregadas do diretório de uploads/test",
    });
    
    console.log("Imagens de teste definidas:", testImages);
  };

  const handleCreateVideo = async () => {
    setLoading(true);
    setVideoUrl(null);
    
    // Mostrar toast informando o início do processo
    toast({
      title: "Iniciando criação do vídeo",
      description: "Este processo pode levar alguns segundos, por favor aguarde...",
    });

    console.log("Configurações para criação de vídeo:", {
      imagePaths,
      outputFileName,
      text,
      duration,
      transition,
      transitionDuration,
      textPosition,
      textColor,
      textAnimation,
      zoomEffect,
      colorGrading,
      autoSubtitle,
      watermark: watermark || undefined,
      outputQuality,
      social
    });

    try {
      // Usar fetch diretamente para ter mais controle sobre a resposta
      toast({
        title: "Processando...",
        description: "Enviando requisição para o servidor...",
      });
      
      const response = await fetch("/api/video/create-advanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          imagePaths,
          outputFileName,
          text,
          duration,
          transition,
          transitionDuration,
          textPosition,
          textColor,
          textAnimation,
          zoomEffect,
          colorGrading,
          autoSubtitle,
          watermark: watermark || undefined,
          outputQuality,
          social
        }),
      });

      toast({
        title: "Recebendo resposta",
        description: "Analisando resposta do servidor...",
      });
      
      const data = await response.json();

      if (response.ok && data.success) {
        setVideoUrl(data.url);
        toast({
          title: "Vídeo criado com sucesso!",
          description: `O vídeo foi gerado e está disponível para visualização`,
        });
      } else {
        toast({
          title: "Erro ao criar vídeo",
          description: data.message || data.error || "Ocorreu um erro desconhecido",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao criar vídeo",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Teste de Recursos Avançados de Vídeo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="basic">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="basic">Configurações Básicas</TabsTrigger>
              <TabsTrigger value="style">Estilo e Animação</TabsTrigger>
              <TabsTrigger value="advanced">Recursos Avançados</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Básicas</CardTitle>
                  <CardDescription>Configure os parâmetros básicos do vídeo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="outputFileName">Nome do arquivo</Label>
                    <Input 
                      id="outputFileName" 
                      value={outputFileName} 
                      onChange={(e) => setOutputFileName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="text">Texto de sobreposição</Label>
                    <Input 
                      id="text" 
                      value={text} 
                      onChange={(e) => setText(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração por imagem (segundos)</Label>
                    <Input 
                      id="duration" 
                      type="number" 
                      value={duration} 
                      onChange={(e) => setDuration(Number(e.target.value))}
                      min={1}
                      max={10}
                      step={0.5}
                    />
                  </div>
                  
                  <div className="pt-2">
                    <Button variant="secondary" onClick={handleTestImages}>
                      Definir Imagens de Teste
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="style">
              <Card>
                <CardHeader>
                  <CardTitle>Estilo e Animação</CardTitle>
                  <CardDescription>Personalize a aparência e animações do vídeo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transition">Transição</Label>
                    <Select value={transition} onValueChange={setTransition}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo de transição" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fade">Fade</SelectItem>
                        <SelectItem value="wipe">Wipe</SelectItem>
                        <SelectItem value="slide">Slide</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="radial">Radial</SelectItem>
                        <SelectItem value="crosszoom">Cross Zoom</SelectItem>
                        <SelectItem value="dissolve">Dissolve</SelectItem>
                        <SelectItem value="pixelize">Pixelize</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transitionDuration">Duração da transição (segundos)</Label>
                    <Input 
                      id="transitionDuration" 
                      type="number" 
                      value={transitionDuration} 
                      onChange={(e) => setTransitionDuration(Number(e.target.value))}
                      min={0.1}
                      max={2}
                      step={0.1}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="textPosition">Posição do texto</Label>
                    <Select value={textPosition} onValueChange={setTextPosition}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a posição do texto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Topo</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="bottom">Inferior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="textColor">Cor do texto</Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        id="textColor" 
                        value={textColor} 
                        onChange={(e) => setTextColor(e.target.value)}
                      />
                      <input 
                        type="color" 
                        value={textColor} 
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-10 h-10 rounded"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="textAnimation">Animação do texto</Label>
                    <Select value={textAnimation} onValueChange={setTextAnimation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a animação do texto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem animação</SelectItem>
                        <SelectItem value="typewriter">Digitação</SelectItem>
                        <SelectItem value="fadein">Fade in</SelectItem>
                        <SelectItem value="slidein">Slide in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="colorGrading">Tratamento de cor</Label>
                    <Select value={colorGrading} onValueChange={setColorGrading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tratamento de cor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem efeito</SelectItem>
                        <SelectItem value="vibrant">Vibrante</SelectItem>
                        <SelectItem value="moody">Mood</SelectItem>
                        <SelectItem value="warm">Quente</SelectItem>
                        <SelectItem value="cool">Frio</SelectItem>
                        <SelectItem value="cinematic">Cinematográfico</SelectItem>
                        <SelectItem value="vintage">Vintage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="advanced">
              <Card>
                <CardHeader>
                  <CardTitle>Recursos Avançados</CardTitle>
                  <CardDescription>Configure recursos avançados para o vídeo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="zoomEffect"
                      checked={zoomEffect}
                      onCheckedChange={setZoomEffect}
                    />
                    <Label htmlFor="zoomEffect">Efeito Ken Burns (zoom suave)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="autoSubtitle"
                      checked={autoSubtitle}
                      onCheckedChange={setAutoSubtitle}
                    />
                    <Label htmlFor="autoSubtitle">Legendas automáticas</Label>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="watermark">Marca d'água (opcional)</Label>
                    <Input 
                      id="watermark" 
                      value={watermark} 
                      onChange={(e) => setWatermark(e.target.value)}
                      placeholder="Texto para marca d'água"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="outputQuality">Qualidade de saída</Label>
                    <Select value={outputQuality} onValueChange={setOutputQuality}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a qualidade de saída" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho (rápido)</SelectItem>
                        <SelectItem value="standard">Padrão</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="ultra">Ultra (lento)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="social">Otimização para rede social</Label>
                    <Select value={social} onValueChange={setSocial}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a rede social" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 flex justify-end">
            <Button 
              disabled={loading} 
              onClick={handleCreateVideo}
              className="w-full md:w-auto"
            >
              {loading ? "Processando..." : "Criar Vídeo Avançado"}
            </Button>
          </div>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Prévia do Vídeo</CardTitle>
              <CardDescription>O vídeo gerado aparecerá aqui</CardDescription>
            </CardHeader>
            <CardContent>
              {videoUrl ? (
                <div className="rounded-md overflow-hidden">
                  <video 
                    src={videoUrl} 
                    controls 
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="bg-gray-100 flex items-center justify-center h-64 rounded-md">
                  {loading ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2">Processando vídeo...</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Nenhum vídeo gerado ainda</p>
                  )}
                </div>
              )}
            </CardContent>
            {videoUrl && (
              <CardFooter className="flex flex-col items-start">
                <p className="text-sm text-gray-500 mb-2">Arquivo: {outputFileName}</p>
                <a 
                  href={videoUrl} 
                  download 
                  className="text-primary text-sm hover:underline"
                >
                  Download do vídeo
                </a>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestAdvancedVideo;