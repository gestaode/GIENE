import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Video, Pencil, Scissors, ChevronRight } from "lucide-react";

interface EditVideoProps {
  id: string;
}

export default function EditVideo({ id }: EditVideoProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("preview");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Buscar dados do vídeo
  const { data: video, isLoading, error } = useQuery({
    queryKey: ['/api/videos', id],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${id}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar o vídeo');
      }
      return response.json();
    }
  });

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar o vídeo",
        description: "Não foi possível carregar os dados do vídeo. Tente novamente."
      });
    }
  }, [error, toast]);

  // Função para avançar para a próxima etapa (agendamento)
  const handleFinishEditing = () => {
    navigate(`/schedule-post/${id}`);
  };

  // Função para processar cortes e edições no vídeo
  const handleProcessEdits = async () => {
    setIsProcessing(true);
    try {
      // Simular o processamento do vídeo (em produção, seria uma chamada real à API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Edição concluída",
        description: "As alterações foram aplicadas ao vídeo com sucesso."
      });
      setIsProcessing(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro na edição",
        description: "Ocorreu um erro ao processar as edições. Tente novamente."
      });
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Carregando vídeo...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Edição de Vídeo</h1>
          <p className="text-muted-foreground">Faça ajustes e refine seu vídeo antes de agendar a publicação</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => navigate('/library')}>
            Cancelar
          </Button>
          <Button onClick={() => setShowConfirmDialog(true)}>
            Avançar para Agendamento <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de visualização e edição */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab}>
              <div className="bg-muted px-4 py-2">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="preview">
                    <Video className="mr-2 h-4 w-4" /> Visualização
                  </TabsTrigger>
                  <TabsTrigger value="trim">
                    <Scissors className="mr-2 h-4 w-4" /> Cortes e Recortes
                  </TabsTrigger>
                  <TabsTrigger value="enhance">
                    <Pencil className="mr-2 h-4 w-4" /> Aprimoramentos
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="preview" className="mt-0">
                <div className="aspect-video bg-black flex items-center justify-center">
                  {video?.videoUrl ? (
                    <video 
                      src={video.videoUrl} 
                      controls 
                      className="max-h-full max-w-full"
                    />
                  ) : (
                    <div className="text-white">
                      <Video className="h-16 w-16 mx-auto mb-4 opacity-40" />
                      <p>Prévia de vídeo não disponível</p>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{video?.title || "Título do vídeo"}</h3>
                  <p className="text-muted-foreground mt-1">
                    {video?.description || "Sem descrição disponível"}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="trim" className="mt-0 p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Cortar segmentos</h3>
                    <p className="text-muted-foreground mb-4">
                      Ajuste os pontos de início e fim para remover partes indesejadas do vídeo
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor="startTime">Ponto de início</Label>
                        <Input id="startTime" placeholder="00:00:00" />
                      </div>
                      <div>
                        <Label htmlFor="endTime">Ponto final</Label>
                        <Input id="endTime" placeholder="00:01:30" />
                      </div>
                    </div>
                    
                    <div className="h-16 bg-muted rounded-md mb-4 relative">
                      <div className="absolute top-0 left-1/4 bottom-0 right-1/4 bg-primary/20 border-l-2 border-r-2 border-primary"></div>
                    </div>
                    
                    <Button 
                      onClick={handleProcessEdits}
                      disabled={isProcessing}
                    >
                      {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Aplicar cortes
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="enhance" className="mt-0 p-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-2">Aprimoramentos de vídeo</h3>
                  <p className="text-muted-foreground mb-4">
                    Melhore a qualidade e a aparência do seu vídeo
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brightness">Brilho</Label>
                      <Input id="brightness" type="range" min="0" max="200" defaultValue="100" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contrast">Contraste</Label>
                      <Input id="contrast" type="range" min="0" max="200" defaultValue="100" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saturation">Saturação</Label>
                      <Input id="saturation" type="range" min="0" max="200" defaultValue="100" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sharpness">Nitidez</Label>
                      <Input id="sharpness" type="range" min="0" max="100" defaultValue="50" />
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleProcessEdits}
                      disabled={isProcessing}
                    >
                      {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Aplicar ajustes
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Painel lateral de propriedades */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Propriedades do Vídeo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="videoTitle">Título do vídeo</Label>
                  <Input 
                    id="videoTitle" 
                    defaultValue={video?.title || ""}
                    placeholder="Adicione um título ao vídeo"
                  />
                </div>
                
                <div>
                  <Label htmlFor="videoDescription">Descrição</Label>
                  <textarea 
                    id="videoDescription"
                    defaultValue={video?.description || ""}
                    placeholder="Adicione uma descrição"
                    className="w-full min-h-[100px] border rounded-md p-2 text-sm"
                  />
                </div>
                
                <div>
                  <Label>Tema</Label>
                  <div className="mt-1">
                    <Badge>{video?.theme || "Não definido"}</Badge>
                  </div>
                </div>
                
                <div>
                  <Label>Detalhes técnicos</Label>
                  <div className="mt-1 text-sm text-muted-foreground space-y-1">
                    <p>Formato: MP4</p>
                    <p>Duração: {video?.duration || "00:00:00"}</p>
                    <p>Resolução: 1280x720</p>
                    <p>Data de criação: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo de confirmação */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar e avançar</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja concluir a edição e avançar para o agendamento do vídeo?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Continuar editando
            </Button>
            <Button onClick={handleFinishEditing}>
              Avançar para agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}