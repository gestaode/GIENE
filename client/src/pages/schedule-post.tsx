import React, { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { CalendarIcon, Instagram, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SchedulePost() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  const [scheduleData, setScheduleData] = useState({
    videoTitle: "Meu Vídeo",
    description: "Descrição para redes sociais",
    hashtags: "#financas #investimentos #dinheiro",
    date: new Date(),
    time: "12:00",
    platforms: {
      instagram: true,
      tiktok: true,
      facebook: false,
      youtube: false,
    }
  });

  const [processing, setProcessing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScheduleData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setScheduleData(prev => ({ ...prev, date }));
    }
  };

  const handleTimeChange = (value: string) => {
    setScheduleData(prev => ({ ...prev, time: value }));
  };

  const handlePlatformChange = (platform: keyof typeof scheduleData.platforms) => {
    setScheduleData(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: !prev.platforms[platform]
      }
    }));
  };

  const handleSchedulePost = () => {
    // Verificar se pelo menos uma plataforma está selecionada
    const hasSelectedPlatform = Object.values(scheduleData.platforms).some(value => value);
    
    if (!hasSelectedPlatform) {
      toast({
        title: "Erro ao agendar",
        description: "Selecione pelo menos uma plataforma para publicação.",
        variant: "destructive",
      });
      return;
    }
    
    setProcessing(true);
    
    // Simulação de API call
    setTimeout(() => {
      setProcessing(false);
      
      toast({
        title: "Publicação agendada",
        description: "Seu vídeo foi agendado com sucesso!",
      });
      
      // Redirecionar para o dashboard
      setLocation("/");
    }, 1500);
  };

  return (
    <>
      <PageHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agendar Publicação</h1>
          <p className="text-gray-600">Programe seu vídeo para ser publicado nas redes sociais</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da publicação</CardTitle>
                <CardDescription>Configure como seu vídeo aparecerá nas redes sociais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título do vídeo</label>
                  <Input 
                    name="videoTitle"
                    value={scheduleData.videoTitle}
                    onChange={handleInputChange}
                    placeholder="Digite o título do vídeo"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição para redes sociais</label>
                  <Textarea 
                    name="description"
                    value={scheduleData.description}
                    onChange={handleInputChange}
                    placeholder="Digite uma descrição atraente para seu vídeo"
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hashtags</label>
                  <Input 
                    name="hashtags"
                    value={scheduleData.hashtags}
                    onChange={handleInputChange}
                    placeholder="#financas #investimentos #dinheiro"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data de publicação</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduleData.date ? (
                            format(scheduleData.date, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={scheduleData.date}
                          onSelect={handleDateChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Horário</label>
                    <Select value={scheduleData.time} onValueChange={handleTimeChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um horário" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, hour) => (
                          <React.Fragment key={hour}>
                            <SelectItem value={`${hour.toString().padStart(2, '0')}:00`}>
                              {hour.toString().padStart(2, '0')}:00
                            </SelectItem>
                            <SelectItem value={`${hour.toString().padStart(2, '0')}:30`}>
                              {hour.toString().padStart(2, '0')}:30
                            </SelectItem>
                          </React.Fragment>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Plataformas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="instagram" 
                        checked={scheduleData.platforms.instagram}
                        onCheckedChange={() => handlePlatformChange("instagram")}
                      />
                      <label
                        htmlFor="instagram"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                      >
                        <span className="mr-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded p-1">
                          <Instagram size={14} className="text-white" />
                        </span>
                        Instagram
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tiktok" 
                        checked={scheduleData.platforms.tiktok}
                        onCheckedChange={() => handlePlatformChange("tiktok")}
                      />
                      <label
                        htmlFor="tiktok"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                      >
                        <span className="mr-2 bg-black rounded p-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19.589 6.686C19.589 6.686 19.589 6.686 19.589 6.686c-0.838-0.755-1.496-1.688-1.915-2.723c-0.411-1.015-0.619-2.101-0.619-3.205h-3.923v14.415c0 1.192-0.969 2.161-2.161 2.161c-1.192 0-2.161-0.969-2.161-2.161c0-1.192 0.969-2.161 2.161-2.161c0.247 0 0.484 0.042 0.705 0.119v-3.973c-0.237-0.032-0.477-0.048-0.72-0.048c-3.015 0-5.463 2.448-5.463 5.463s2.448 5.463 5.463 5.463c3.015 0 5.463-2.448 5.463-5.463c0-0.075-0.002-0.149-0.005-0.224l-0.004-7.749c1.548 1.057 3.393 1.756 5.379 1.956v-3.924C21.056 7.072 20.354 6.927 19.589 6.686z" fill="white"/>
                          </svg>
                        </span>
                        TikTok
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="facebook" 
                        checked={scheduleData.platforms.facebook}
                        onCheckedChange={() => handlePlatformChange("facebook")}
                      />
                      <label
                        htmlFor="facebook"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                      >
                        <span className="mr-2 bg-blue-600 rounded p-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="white"/>
                          </svg>
                        </span>
                        Facebook
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="youtube" 
                        checked={scheduleData.platforms.youtube}
                        onCheckedChange={() => handlePlatformChange("youtube")}
                      />
                      <label
                        htmlFor="youtube"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                      >
                        <span className="mr-2 bg-red-600 rounded p-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white"/>
                          </svg>
                        </span>
                        YouTube
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/edit-video")}
                >
                  Voltar
                </Button>
                <Button 
                  onClick={handleSchedulePost}
                  disabled={processing}
                >
                  {processing ? "Processando..." : "Agendar publicação"}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo da publicação</CardTitle>
                <CardDescription>Revisão do agendamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Detalhes</h4>
                  <p className="text-sm text-gray-600 mb-1"><strong>Título:</strong> {scheduleData.videoTitle}</p>
                  <p className="text-sm text-gray-600 mb-1"><strong>Hashtags:</strong> {scheduleData.hashtags}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Agendamento</h4>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>
                      {format(scheduleData.date, "PPP", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{scheduleData.time}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Plataformas</h4>
                  <div className="flex flex-wrap gap-2">
                    {scheduleData.platforms.instagram && (
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded text-xs flex items-center">
                        <Instagram size={12} className="mr-1" />
                        Instagram
                      </div>
                    )}
                    {scheduleData.platforms.tiktok && (
                      <div className="bg-black text-white px-2 py-1 rounded text-xs flex items-center">
                        <svg width="12" height="12" className="mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19.589 6.686C19.589 6.686 19.589 6.686 19.589 6.686c-0.838-0.755-1.496-1.688-1.915-2.723c-0.411-1.015-0.619-2.101-0.619-3.205h-3.923v14.415c0 1.192-0.969 2.161-2.161 2.161c-1.192 0-2.161-0.969-2.161-2.161c0-1.192 0.969-2.161 2.161-2.161c0.247 0 0.484 0.042 0.705 0.119v-3.973c-0.237-0.032-0.477-0.048-0.72-0.048c-3.015 0-5.463 2.448-5.463 5.463s2.448 5.463 5.463 5.463c3.015 0 5.463-2.448 5.463-5.463c0-0.075-0.002-0.149-0.005-0.224l-0.004-7.749c1.548 1.057 3.393 1.756 5.379 1.956v-3.924C21.056 7.072 20.354 6.927 19.589 6.686z" fill="white"/>
                        </svg>
                        TikTok
                      </div>
                    )}
                    {scheduleData.platforms.facebook && (
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center">
                        <svg width="12" height="12" className="mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="white"/>
                        </svg>
                        Facebook
                      </div>
                    )}
                    {scheduleData.platforms.youtube && (
                      <div className="bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center">
                        <svg width="12" height="12" className="mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white"/>
                        </svg>
                        YouTube
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}