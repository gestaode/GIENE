import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Loader2, 
  ChevronRight, 
  Instagram, 
  TrendingUp,
  Hash,
  PlusCircle,
  Save,
  Trash2,
  Check,
  Share2
} from "lucide-react";

interface SchedulePostProps {
  id: string;
}

export default function SchedulePost({ id }: SchedulePostProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isScheduling, setIsScheduling] = useState(false);
  const [isTrendSheetOpen, setIsTrendSheetOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("12:00");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "tiktok"]);
  
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

  // Busca de hashtags populares
  const { data: trendingHashtags, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['/api/tiktok-trends/hashtags'],
    queryFn: async () => {
      const response = await fetch('/api/tiktok-trends/hashtags?limit=20');
      if (!response.ok) {
        throw new Error('Erro ao carregar tendências');
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

  useEffect(() => {
    if (video) {
      setTitle(video.title || "");
      setDescription(video.description || "");
      
      if (video.tags && Array.isArray(video.tags)) {
        setHashtags(video.tags.map(tag => tag.startsWith('#') ? tag : `#${tag}`));
      }
    }
  }, [video]);

  const handleAddHashtag = () => {
    if (!newHashtag.trim()) return;
    
    const tag = newHashtag.trim().startsWith('#') 
      ? newHashtag.trim() 
      : `#${newHashtag.trim()}`;
      
    if (!hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    
    setNewHashtag("");
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const handleAddTrendingHashtag = (tag: string) => {
    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
    if (!hashtags.includes(formattedTag)) {
      setHashtags([...hashtags, formattedTag]);
    }
  };

  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const handleSchedulePost = async () => {
    if (!title) {
      toast({
        variant: "destructive",
        title: "Título obrigatório",
        description: "Por favor, adicione um título para a sua publicação."
      });
      return;
    }

    if (!date) {
      toast({
        variant: "destructive",
        title: "Data obrigatória",
        description: "Por favor, selecione uma data para o agendamento."
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        variant: "destructive",
        title: "Plataforma obrigatória",
        description: "Selecione pelo menos uma plataforma para publicação."
      });
      return;
    }

    // Combinar data e hora
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledTime = new Date(date);
    scheduledTime.setHours(hours, minutes);

    setIsScheduling(true);
    
    try {
      // Aqui faria a chamada real para API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Agendamento realizado",
        description: `Seu vídeo foi agendado para ${format(scheduledTime, "PPP 'às' HH:mm", { locale: pt })}`,
      });
      
      // Redirecionar para a página de agendamentos
      navigate('/schedule');
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro no agendamento",
        description: "Não foi possível agendar a publicação. Tente novamente."
      });
    } finally {
      setIsScheduling(false);
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
          <h1 className="text-3xl font-bold">Agendamento de Publicação</h1>
          <p className="text-muted-foreground">Configure os detalhes e agende o seu vídeo para as redes sociais</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => navigate(`/edit-video/${id}`)}>
            Voltar para edição
          </Button>
          <Button 
            onClick={handleSchedulePost}
            disabled={isScheduling}
          >
            {isScheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Agendar Publicação <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conteúdo principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prévia do vídeo */}
          <Card>
            <CardHeader>
              <CardTitle>Prévia do Vídeo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-black flex items-center justify-center mb-4">
                {video?.videoUrl ? (
                  <video 
                    src={video.videoUrl} 
                    controls 
                    className="max-h-full max-w-full"
                  />
                ) : (
                  <div className="text-white text-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-16 w-16 mx-auto mb-4 opacity-40"
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p>Prévia de vídeo não disponível</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detalhes da publicação */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Publicação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="postTitle">Título da publicação</Label>
                  <Input 
                    id="postTitle" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Adicione um título para sua publicação"
                  />
                </div>
                
                <div>
                  <Label htmlFor="postDescription">Descrição</Label>
                  <Textarea 
                    id="postDescription"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Adicione uma descrição atraente para seu vídeo"
                    className="min-h-[120px]"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="hashtags">Hashtags</Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsTrendSheetOpen(true)}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" /> 
                      Ver tendências
                    </Button>
                  </div>
                  
                  <div className="flex mb-2">
                    <div className="flex-1 mr-2">
                      <Input 
                        id="hashtags" 
                        value={newHashtag}
                        onChange={e => setNewHashtag(e.target.value)}
                        placeholder="Adicione hashtags"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddHashtag();
                          }
                        }}
                      />
                    </div>
                    <Button onClick={handleAddHashtag}>
                      <PlusCircle className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {hashtags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                        <Hash className="h-3 w-3" /> {tag.replace('#', '')}
                        <button 
                          onClick={() => handleRemoveHashtag(tag)}
                          className="ml-1 rounded-full hover:bg-red-100 p-0.5"
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </button>
                      </Badge>
                    ))}
                    {hashtags.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma hashtag adicionada ainda
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel lateral */}
        <div className="space-y-6">
          {/* Agendamento */}
          <Card>
            <CardHeader>
              <CardTitle>Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Data de publicação</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: pt }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        locale={pt}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label htmlFor="time">Horário</Label>
                  <div className="flex items-center mt-1">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="time" 
                      type="time" 
                      value={time}
                      onChange={e => setTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label>Plataformas</Label>
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Instagram className="h-5 w-5 text-pink-500" />
                        <span>Instagram</span>
                      </div>
                      <Switch 
                        checked={selectedPlatforms.includes('instagram')}
                        onCheckedChange={() => togglePlatform('instagram')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                        </svg>
                        <span>TikTok</span>
                      </div>
                      <Switch 
                        checked={selectedPlatforms.includes('tiktok')}
                        onCheckedChange={() => togglePlatform('tiktok')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                        <span>YouTube</span>
                      </div>
                      <Switch 
                        checked={selectedPlatforms.includes('youtube')}
                        onCheckedChange={() => togglePlatform('youtube')}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label>Opções avançadas</Label>
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Share2 className="h-4 w-4" />
                        <span className="text-sm">Compartilhar automaticamente</span>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Save className="h-4 w-4" />
                        <span className="text-sm">Salvar no histórico</span>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Título:</span>
                  <span className="font-medium">{title || "Não definido"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plataformas:</span>
                  <span className="font-medium">{selectedPlatforms.length} selecionadas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium">
                    {date ? format(date, "dd/MM/yyyy", { locale: pt }) : "Não definida"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horário:</span>
                  <span className="font-medium">{time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hashtags:</span>
                  <span className="font-medium">{hashtags.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sheet de tendências */}
      <Sheet open={isTrendSheetOpen} onOpenChange={setIsTrendSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Hashtags em Alta</SheetTitle>
            <SheetDescription>
              Clique em uma hashtag para adicioná-la ao seu post
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6">
            {isLoadingTrends ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {trendingHashtags?.topics?.map((trend: any) => (
                  <div 
                    key={trend.name} 
                    className="flex justify-between items-center p-3 hover:bg-muted rounded-md cursor-pointer"
                    onClick={() => {
                      handleAddTrendingHashtag(trend.name);
                      toast({
                        title: "Hashtag adicionada",
                        description: `#${trend.name} foi adicionada à sua lista`
                      });
                    }}
                  >
                    <div>
                      <p className="font-medium flex items-center">
                        <Hash className="h-4 w-4 mr-1" />
                        {trend.name}
                      </p>
                      {trend.views && (
                        <p className="text-sm text-muted-foreground">
                          {trend.views.toLocaleString()} visualizações
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {(!trendingHashtags?.topics || trendingHashtags.topics.length === 0) && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhuma tendência encontrada no momento
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}