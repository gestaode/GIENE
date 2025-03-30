import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const FFmpegTester = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const runFFmpegTest = async () => {
    setLoading(true);
    setResults(null);
    setVideoUrl(null);
    
    try {
      toast({
        title: "Iniciando teste do FFmpeg",
        description: "Aguarde enquanto executamos o teste...",
      });
      
      const response = await fetch('/api/video/test-ffmpeg');
      const data = await response.json();
      
      setResults(data);
      
      if (data.success && data.videoUrl) {
        setVideoUrl(data.videoUrl);
        toast({
          title: "Teste concluído com sucesso",
          description: "O vídeo de teste foi gerado com sucesso."
        });
      } else {
        toast({
          title: "Erro no teste",
          description: data.message || "Ocorreu um erro ao executar o teste do FFmpeg.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao testar FFmpeg:", error);
      toast({
        title: "Erro ao testar FFmpeg",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runCompleteWorkflowTest = async () => {
    setLoading(true);
    setResults(null);
    setVideoUrl(null);
    
    try {
      toast({
        title: "Iniciando teste completo",
        description: "Aguarde enquanto executamos o teste completo do fluxo de trabalho...",
      });
      
      const response = await fetch('/api/video/test-complete-workflow', {
        method: 'POST'
      });
      const data = await response.json();
      
      setResults(data);
      
      if (data.success && data.url) {
        setVideoUrl(data.url);
        toast({
          title: "Teste completo finalizado com sucesso",
          description: "O vídeo foi gerado com todas as etapas do fluxo."
        });
      } else {
        toast({
          title: "Erro no teste completo",
          description: data.message || "Ocorreu um erro ao executar o teste completo.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao executar teste completo:", error);
      toast({
        title: "Erro no teste completo",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runSimpleTextVideoTest = async () => {
    setLoading(true);
    setResults(null);
    setVideoUrl(null);
    
    try {
      toast({
        title: "Iniciando teste de vídeo com texto",
        description: "Aguarde enquanto criamos um vídeo simples com texto...",
      });
      
      const response = await fetch('/api/video/create-simple-test', {
        method: 'POST'
      });
      const data = await response.json();
      
      setResults(data);
      
      if (data.success && data.url) {
        setVideoUrl(data.url);
        toast({
          title: "Vídeo com texto criado",
          description: "O vídeo com texto foi gerado com sucesso."
        });
      } else {
        toast({
          title: "Erro ao criar vídeo com texto",
          description: data.message || "Ocorreu um erro ao criar o vídeo com texto.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao criar vídeo com texto:", error);
      toast({
        title: "Erro ao criar vídeo com texto",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Ferramenta de Teste do FFmpeg</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Teste Básico</CardTitle>
            <CardDescription>Verifica se o FFmpeg está funcionando corretamente</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Este teste verifica a instalação do FFmpeg e tenta criar um vídeo simples com uma imagem gerada.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={runFFmpegTest} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Executando..." : "Executar Teste FFmpeg"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Teste de Vídeo com Texto</CardTitle>
            <CardDescription>Cria um vídeo simples com texto</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Este teste cria um vídeo simples que contém apenas texto sobre um fundo preto.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={runSimpleTextVideoTest} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Executando..." : "Criar Vídeo com Texto"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Teste Completo</CardTitle>
            <CardDescription>Executa todo o fluxo de trabalho</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Este teste executa o fluxo completo: cria imagens, gera áudio e compõe um vídeo com todos os elementos.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={runCompleteWorkflowTest} 
              disabled={loading}
              className="w-full"
              variant="default"
            >
              {loading ? "Executando..." : "Executar Teste Completo"}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {results && (
        <>
          <Separator className="my-6" />
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Resultado do Teste</h2>
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Resultado</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className={results.success ? "bg-green-50" : "bg-red-50"}>
                  <AlertTitle className={results.success ? "text-green-600" : "text-red-600"}>
                    {results.success ? "Sucesso" : "Erro"}
                  </AlertTitle>
                  <AlertDescription className={results.success ? "text-green-700" : "text-red-700"}>
                    {results.message || (results.success ? "O teste foi executado com sucesso." : "Ocorreu um erro ao executar o teste.")}
                  </AlertDescription>
                </Alert>
                
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Dados do Resultado:</h3>
                  <pre className="bg-slate-100 p-4 rounded-md text-sm overflow-auto max-h-48">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {videoUrl && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Vídeo Gerado</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="aspect-video bg-black rounded-md overflow-hidden">
                    <video 
                      src={videoUrl} 
                      controls 
                      className="w-full h-full"
                      poster="/images/video-placeholder.png"
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(videoUrl, '_blank')}
                    >
                      Abrir Vídeo em Nova Aba
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FFmpegTester;