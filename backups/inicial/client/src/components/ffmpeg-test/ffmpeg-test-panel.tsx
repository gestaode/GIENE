import React, { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Code, Download, Film, RefreshCcw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TestResult {
  success: boolean;
  message: string;
  url?: string;
  fileName?: string;
  filePath?: string;
  details?: any;
  metadata?: {
    duration: number;
    width: number;
    height: number;
    format: string;
  };
  error?: string;
}

export function FFmpegTestPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [result, setResult] = useState<TestResult | null>(null);
  const [logOpen, setLogOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<string>("");
  const [ffmpegVersion, setFfmpegVersion] = useState<string>("");

  // Estados específicos para a criação de vídeo com texto
  const [text, setText] = useState<string>("Testando geração de vídeo com texto");
  const [backgroundColor, setBackgroundColor] = useState<string>("#000000");
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [duration, setDuration] = useState<number>(5);
  const [fontSize, setFontSize] = useState<number>(60);
  const [frameRate, setFrameRate] = useState<number>(30);
  const [outputQuality, setOutputQuality] = useState<string>("medium");

  // Estados para vídeo avançado
  const [transition, setTransition] = useState<string>("fade");
  const [transitionDuration, setTransitionDuration] = useState<number>(0.5);
  const [textPosition, setTextPosition] = useState<string>("bottom");
  const [colorGrading, setColorGrading] = useState<string>("vibrant");
  const [zoomEffect, setZoomEffect] = useState<boolean>(true);
  const [autoSubtitle, setAutoSubtitle] = useState<boolean>(false);
  const [social, setSocial] = useState<string>("tiktok");

  // Verificar versão do FFmpeg quando o componente carrega
  useEffect(() => {
    async function fetchFfmpegVersion() {
      try {
        const response = await fetch("/api/video/test-ffmpeg");
        const data = await response.json();
        if (data.success && data.version) {
          setFfmpegVersion(data.version);
        }
      } catch (error) {
        console.error("Erro ao verificar versão do FFmpeg:", error);
      }
    }
    
    fetchFfmpegVersion();
  }, []);

  // Função para adicionar logs
  const addLog = useCallback((message: string) => {
    setLogs(prev => `${prev}\n[${new Date().toLocaleTimeString()}] ${message}`);
  }, []);

  // Função para limpar logs
  const clearLogs = useCallback(() => {
    setLogs("");
  }, []);

  // Teste básico de FFmpeg
  const runBasicTest = async () => {
    setLoading(true);
    setResult(null);
    clearLogs();
    
    try {
      addLog("Iniciando teste básico do FFmpeg...");
      
      const response = await fetch("/api/video/test-ffmpeg");
      const data = await response.json();
      
      setResult(data);
      addLog(data.success 
        ? `Teste concluído com sucesso. Versão detectada: ${data.version}` 
        : `Falha no teste: ${data.message}`);
        
      toast({
        title: data.success ? "Teste concluído" : "Falha no teste",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
    } catch (error) {
      addLog(`Erro na execução do teste: ${error instanceof Error ? error.message : String(error)}`);
      setResult({
        success: false,
        message: "Erro na execução do teste",
        error: error instanceof Error ? error.message : String(error)
      });
      
      toast({
        title: "Erro no teste",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Teste de criação de vídeo com texto
  const runTextVideoTest = async () => {
    setLoading(true);
    setResult(null);
    clearLogs();
    
    try {
      addLog(`Iniciando criação de vídeo com texto: "${text}"`);
      addLog(`Configurações: Duração: ${duration}s, FPS: ${frameRate}, Qualidade: ${outputQuality}`);
      
      const response = await fetch("/api/video/create-simple-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          outputFileName: `text_video_test_${Date.now()}.mp4`,
          width: 1080,
          height: 1920,
          backgroundColor: backgroundColor.replace('#', ''),
          textColor: textColor.replace('#', ''),
          fontFamily: "Arial",
          fontSize,
          frameRate,
          duration,
          bitrate: getBitrateFromQuality(outputQuality)
        })
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.url) {
        addLog(`Vídeo gerado com sucesso: ${data.url}`);
        addLog(`Metadados: ${JSON.stringify(data.metadata || {})}`);
      } else {
        addLog(`Falha na geração do vídeo: ${data.message}`);
      }
      
      toast({
        title: data.url ? "Vídeo gerado com sucesso" : "Falha na geração",
        description: data.url ? "O vídeo foi criado e está pronto para visualização" : data.message,
        variant: data.url ? "default" : "destructive"
      });
    } catch (error) {
      addLog(`Erro na criação do vídeo: ${error instanceof Error ? error.message : String(error)}`);
      setResult({
        success: false,
        message: "Erro na criação do vídeo",
        error: error instanceof Error ? error.message : String(error)
      });
      
      toast({
        title: "Erro na criação do vídeo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Teste de fluxo completo
  const runCompleteWorkflowTest = async () => {
    setLoading(true);
    setResult(null);
    clearLogs();
    
    try {
      addLog("Iniciando teste de fluxo completo de geração de vídeo...");
      addLog(`Configurações: Transição: ${transition}, Duração: ${transitionDuration}s, Posição do texto: ${textPosition}`);
      addLog(`Efeitos: Zoom: ${zoomEffect ? "Sim" : "Não"}, Legendas automáticas: ${autoSubtitle ? "Sim" : "Não"}, Destino: ${social.toUpperCase()}`);
      
      const response = await fetch("/api/video/test-complete-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transition,
          transitionDuration,
          textPosition,
          colorGrading,
          zoomEffect,
          autoSubtitle,
          outputQuality,
          social
        })
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.url) {
        addLog(`Fluxo completo executado com sucesso! Vídeo gerado: ${data.url}`);
        addLog(`Detalhes: ${JSON.stringify(data.details || {})}`);
      } else {
        addLog(`Falha no fluxo completo: ${data.message}`);
        if (data.error) addLog(`Detalhes do erro: ${data.error}`);
      }
      
      toast({
        title: data.success ? "Fluxo completo executado" : "Falha no fluxo completo",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
    } catch (error) {
      addLog(`Erro na execução do fluxo completo: ${error instanceof Error ? error.message : String(error)}`);
      setResult({
        success: false,
        message: "Erro na execução do fluxo completo",
        error: error instanceof Error ? error.message : String(error)
      });
      
      toast({
        title: "Erro no fluxo completo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Teste avançado
  const runAdvancedTest = async () => {
    setLoading(true);
    setResult(null);
    clearLogs();
    
    try {
      addLog("Iniciando teste avançado com configurações customizadas...");
      
      // Esta função simularia um teste avançado
      // No mundo real, você implementaria a chamada real para a API
      
      toast({
        title: "Teste avançado iniciado",
        description: "Esta funcionalidade será implementada em breve",
      });

      addLog("Teste avançado não implementado completamente. Em desenvolvimento.");
      setResult({
        success: false,
        message: "Funcionalidade em desenvolvimento",
      });
    } catch (error) {
      addLog(`Erro no teste avançado: ${error instanceof Error ? error.message : String(error)}`);
      setResult({
        success: false,
        message: "Erro no teste avançado",
        error: error instanceof Error ? error.message : String(error)
      });
      
      toast({
        title: "Erro no teste avançado",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Utilitário para obter bitrate com base na qualidade
  const getBitrateFromQuality = (quality: string): string => {
    const bitrateMap: Record<string, string> = {
      low: "1M",
      medium: "3M",
      high: "5M",
      ultra: "8M"
    };
    
    return bitrateMap[quality] || "3M";
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Diagnóstico Avançado de FFmpeg</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Esta ferramenta permite testar e diagnosticar todas as funcionalidades do FFmpeg necessárias para a plataforma VideoGenie.
          </p>
          
          {ffmpegVersion && (
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-300">FFmpeg detectado</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                {ffmpegVersion}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {/* Tabs para os diferentes testes */}
        <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="basic">Diagnóstico Básico</TabsTrigger>
            <TabsTrigger value="text">Vídeo com Texto</TabsTrigger>
            <TabsTrigger value="complete">Fluxo Completo</TabsTrigger>
            <TabsTrigger value="advanced">Configuração Avançada</TabsTrigger>
          </TabsList>
          
          {/* Tab de Diagnóstico Básico */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Diagnóstico Básico de FFmpeg</CardTitle>
                <CardDescription>
                  Verifica a instalação e funcionalidade básica do FFmpeg, incluindo versão e capacidade de gerar vídeos simples.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  Este teste verifica se o FFmpeg está instalado corretamente no sistema e se consegue realizar operações básicas de processamento de vídeo. 
                  O teste também verifica a versão do FFmpeg e confirma se há suporte para todos os codecs necessários.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={runBasicTest} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                      Executando diagnóstico...
                    </>
                  ) : (
                    "Executar Diagnóstico Básico"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Tab de Vídeo com Texto */}
          <TabsContent value="text" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Criação de Vídeo com Texto</CardTitle>
                <CardDescription>
                  Crie um vídeo contendo apenas texto sobre um fundo de cor sólida.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="text">Texto do Vídeo</Label>
                    <Textarea 
                      id="text" 
                      value={text} 
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Digite o texto que será exibido no vídeo"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                      <div className="flex">
                        <Input 
                          id="backgroundColor" 
                          type="color" 
                          value={backgroundColor} 
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-12 h-10 p-1 mr-2"
                        />
                        <Input 
                          type="text" 
                          value={backgroundColor} 
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="textColor">Cor do Texto</Label>
                      <div className="flex">
                        <Input 
                          id="textColor" 
                          type="color" 
                          value={textColor} 
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-12 h-10 p-1 mr-2"
                        />
                        <Input 
                          type="text" 
                          value={textColor} 
                          onChange={(e) => setTextColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (segundos): {duration}s</Label>
                    <Slider 
                      id="duration" 
                      min={1} 
                      max={30} 
                      step={1} 
                      value={[duration]} 
                      onValueChange={([value]) => setDuration(value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fontSize">Tamanho da Fonte: {fontSize}px</Label>
                    <Slider 
                      id="fontSize" 
                      min={20} 
                      max={120} 
                      step={1} 
                      value={[fontSize]} 
                      onValueChange={([value]) => setFontSize(value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="frameRate">Taxa de Quadros: {frameRate} FPS</Label>
                    <Slider 
                      id="frameRate" 
                      min={15} 
                      max={60} 
                      step={1} 
                      value={[frameRate]} 
                      onValueChange={([value]) => setFrameRate(value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="outputQuality">Qualidade do Vídeo</Label>
                    <Select value={outputQuality} onValueChange={setOutputQuality}>
                      <SelectTrigger id="outputQuality">
                        <SelectValue placeholder="Selecione a qualidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa (1Mbps)</SelectItem>
                        <SelectItem value="medium">Média (3Mbps)</SelectItem>
                        <SelectItem value="high">Alta (5Mbps)</SelectItem>
                        <SelectItem value="ultra">Ultra (8Mbps)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={runTextVideoTest} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                      Gerando vídeo...
                    </>
                  ) : (
                    "Criar Vídeo com Texto"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Tab de Fluxo Completo */}
          <TabsContent value="complete" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teste de Fluxo Completo</CardTitle>
                <CardDescription>
                  Execute um teste completo de geração de vídeo com imagens, áudio e efeitos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transition">Transição</Label>
                    <Select value={transition} onValueChange={setTransition}>
                      <SelectTrigger id="transition">
                        <SelectValue placeholder="Selecione o tipo de transição" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fade">Fade</SelectItem>
                        <SelectItem value="wipe">Wipe</SelectItem>
                        <SelectItem value="slide">Slide</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transitionDuration">Duração da Transição: {transitionDuration}s</Label>
                    <Slider 
                      id="transitionDuration" 
                      min={0.1} 
                      max={2.0} 
                      step={0.1} 
                      value={[transitionDuration]} 
                      onValueChange={([value]) => setTransitionDuration(value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="textPosition">Posição do Texto</Label>
                    <Select value={textPosition} onValueChange={setTextPosition}>
                      <SelectTrigger id="textPosition">
                        <SelectValue placeholder="Selecione a posição do texto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Superior</SelectItem>
                        <SelectItem value="middle">Centro</SelectItem>
                        <SelectItem value="bottom">Inferior</SelectItem>
                        <SelectItem value="topleft">Superior Esquerdo</SelectItem>
                        <SelectItem value="topright">Superior Direito</SelectItem>
                        <SelectItem value="bottomleft">Inferior Esquerdo</SelectItem>
                        <SelectItem value="bottomright">Inferior Direito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="colorGrading">Tratamento de Cor</Label>
                    <Select value={colorGrading} onValueChange={setColorGrading}>
                      <SelectTrigger id="colorGrading">
                        <SelectValue placeholder="Selecione o tratamento de cor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="vibrant">Vibrante</SelectItem>
                        <SelectItem value="warm">Quente</SelectItem>
                        <SelectItem value="cool">Frio</SelectItem>
                        <SelectItem value="vintage">Vintage</SelectItem>
                        <SelectItem value="bw">Preto e Branco</SelectItem>
                        <SelectItem value="sepia">Sépia</SelectItem>
                        <SelectItem value="dramatic">Dramático</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="social">Formato para Rede Social</Label>
                    <Select value={social} onValueChange={setSocial}>
                      <SelectTrigger id="social">
                        <SelectValue placeholder="Selecione o formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tiktok">TikTok (9:16)</SelectItem>
                        <SelectItem value="instagram">Instagram (9:16)</SelectItem>
                        <SelectItem value="youtube">YouTube (16:9)</SelectItem>
                        <SelectItem value="facebook">Facebook (16:9)</SelectItem>
                        <SelectItem value="twitter">Twitter (16:9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="outputQuality2">Qualidade do Vídeo</Label>
                    <Select value={outputQuality} onValueChange={setOutputQuality}>
                      <SelectTrigger id="outputQuality2">
                        <SelectValue placeholder="Selecione a qualidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="ultra">Ultra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="zoomEffect"
                      checked={zoomEffect}
                      onCheckedChange={setZoomEffect}
                    />
                    <Label htmlFor="zoomEffect">Efeito de Zoom Ken Burns</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoSubtitle"
                      checked={autoSubtitle}
                      onCheckedChange={setAutoSubtitle}
                    />
                    <Label htmlFor="autoSubtitle">Legendas Automáticas</Label>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={runCompleteWorkflowTest} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                      Executando fluxo completo...
                    </>
                  ) : (
                    "Executar Fluxo Completo"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Tab de Configuração Avançada */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração Avançada</CardTitle>
                <CardDescription>
                  Configure manualmente parâmetros avançados do FFmpeg para criação de vídeos personalizados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 text-center">
                  <Film className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">Configuração Avançada em Desenvolvimento</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Esta funcionalidade avançada está em desenvolvimento e será disponibilizada em breve.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={runAdvancedTest} 
                  disabled={true}
                  className="w-full"
                >
                  Em Desenvolvimento
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Área de resultados */}
        {result && (
          <div className="space-y-6">
            <Separator />
            
            <div>
              <h2 className="text-2xl font-bold mb-4">Resultado do Teste</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle className={result.success ? "text-green-600" : "text-red-600"}>
                    {result.success ? "Teste Executado com Sucesso" : "Falha no Teste"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className={result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertTitle className={result.success ? "text-green-800" : "text-red-800"}>
                      {result.success ? "Sucesso" : "Erro"}
                    </AlertTitle>
                    <AlertDescription className={result.success ? "text-green-700" : "text-red-700"}>
                      {result.message}
                    </AlertDescription>
                  </Alert>
                  
                  {result.error && (
                    <div className="bg-red-50 p-3 rounded-md border border-red-200">
                      <h3 className="text-red-800 font-semibold text-sm mb-1">Detalhes do erro:</h3>
                      <p className="text-red-700 text-xs">{result.error}</p>
                    </div>
                  )}
                  
                  {result.url && (
                    <div className="aspect-video bg-black rounded-md overflow-hidden">
                      <video 
                        src={result.url} 
                        controls 
                        className="w-full h-full"
                      />
                    </div>
                  )}
                  
                  {result.metadata && (
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                      <h3 className="text-blue-800 font-semibold mb-2">Metadados do Vídeo:</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium text-blue-700">Duração:</span> {result.metadata.duration}s
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Formato:</span> {result.metadata.format}
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Resolução:</span> {result.metadata.width}x{result.metadata.height}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {result.details && (
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                      <h3 className="text-gray-800 font-semibold mb-2">Detalhes Adicionais:</h3>
                      <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col items-stretch space-y-2">
                  {result.url && (
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(result.url, '_blank')}
                      className="w-full flex items-center justify-center"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Abrir Vídeo em Nova Aba
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
        
        {/* Console de Logs */}
        <div>
          <Collapsible
            open={logOpen}
            onOpenChange={setLogOpen}
            className="w-full"
          >
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <Code className="h-4 w-4" />
                <h3 className="text-sm font-semibold">Console de Logs</h3>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  {logOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent>
              <Card>
                <CardContent className="pt-4">
                  <ScrollArea className="h-40 w-full">
                    <pre className="text-xs font-mono p-2 bg-gray-900 text-gray-100 rounded">
                      {logs || "Nenhum log disponível."}
                    </pre>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="flex justify-end py-2">
                  <Button variant="outline" size="sm" onClick={clearLogs}>
                    Limpar Logs
                  </Button>
                </CardFooter>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}