import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Clock, Loader2, Instagram } from "lucide-react";
import { BrandTiktok } from "@/components/ui/brand-icons";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ScheduledVideo {
  id: number;
  title: string;
  description?: string;
  status: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  scheduledAt: string;
  platform: string[];
}

interface ScheduleFormProps {
  selectedVideo: ScheduledVideo | null;
  onClearSelection: () => void;
}

const scheduleFormSchema = z.object({
  videoId: z.number().optional(),
  scheduledDate: z.date(),
  scheduledTime: z.string().min(1, "O horário é obrigatório"),
  platforms: z.array(z.string()).min(1, "Selecione pelo menos uma plataforma"),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export function ScheduleForm({ selectedVideo, onClearSelection }: ScheduleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  
  // Handle form
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: selectedVideo
      ? {
          videoId: selectedVideo.id,
          scheduledDate: new Date(selectedVideo.scheduledAt),
          scheduledTime: format(new Date(selectedVideo.scheduledAt), "HH:mm"),
          platforms: selectedVideo.platform,
        }
      : {
          scheduledDate: new Date(),
          scheduledTime: format(new Date(), "HH:mm"),
          platforms: ["tiktok", "instagram"],
        },
  });
  
  // Setup mutation
  const scheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormValues) => {
      // Combine date and time
      const scheduledAt = new Date(data.scheduledDate);
      const [hours, minutes] = data.scheduledTime.split(":").map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);
      
      // Prepare the request payload
      const payload = {
        scheduledAt: scheduledAt.toISOString(),
        platform: data.platforms,
        status: "scheduled",
      };
      
      // If we're updating an existing video
      if (data.videoId) {
        const response = await apiRequest("PATCH", `/api/videos/${data.videoId}`, payload);
        return response.json();
      }
      
      // Otherwise, we need to select a video first (not implemented in this demo)
      throw new Error("Selecione um vídeo para agendar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Agendamento atualizado",
        description: "O vídeo foi agendado com sucesso.",
      });
      onClearSelection();
    },
    onError: (error) => {
      toast({
        title: "Erro ao agendar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao agendar o vídeo.",
        variant: "destructive",
      });
    },
  });
  
  // Cancel schedule mutation
  const cancelScheduleMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await apiRequest("PATCH", `/api/videos/${videoId}`, {
        status: "ready",
        scheduledAt: null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Agendamento cancelado",
        description: "O agendamento do vídeo foi cancelado com sucesso.",
      });
      onClearSelection();
    },
    onError: (error) => {
      toast({
        title: "Erro ao cancelar agendamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao cancelar o agendamento.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: ScheduleFormValues) => {
    scheduleMutation.mutate(values);
  };
  
  // Handle cancel schedule
  const handleCancelSchedule = () => {
    if (selectedVideo) {
      cancelScheduleMutation.mutate(selectedVideo.id);
    }
  };
  
  // Helper function to check if a date is in the past
  const isDateInPast = (date: Date) => {
    return date < new Date();
  };
  
  return (
    <div>
      {selectedVideo ? (
        <div>
          <div className="mb-4">
            <h4 className="font-medium text-gray-800">{selectedVideo.title}</h4>
            <p className="text-sm text-gray-500 mt-1">
              Agendado para: {format(new Date(selectedVideo.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span className="text-gray-500">Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => isDateInPast(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="scheduledTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Input
                            type="time"
                            {...field}
                          />
                          <Clock className="ml-2 h-4 w-4 opacity-50 self-center" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="platforms"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel className="text-base">Plataformas</FormLabel>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <FormField
                          control={form.control}
                          name="platforms"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes("tiktok")}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, "tiktok"]);
                                    } else {
                                      field.onChange(current.filter(value => value !== "tiktok"));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer flex items-center">
                                <BrandTiktok className="mr-1 h-4 w-4" />
                                TikTok
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <FormField
                          control={form.control}
                          name="platforms"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes("instagram")}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, "instagram"]);
                                    } else {
                                      field.onChange(current.filter(value => value !== "instagram"));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer flex items-center">
                                <Instagram className="mr-1 h-4 w-4" />
                                Instagram
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2 pt-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={scheduleMutation.isPending}
                >
                  {scheduleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    "Atualizar Agendamento"
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleCancelSchedule}
                  disabled={cancelScheduleMutation.isPending}
                >
                  {cancelScheduleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    "Cancelar Agendamento"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      ) : (
        <div className="text-center p-4">
          <p className="text-gray-500 mb-4">
            Selecione um vídeo agendado no calendário para ver os detalhes ou editar o agendamento.
          </p>
          <Button 
            onClick={() => setShowVideoSelector(true)}
            disabled={true} // Disabled in this demo
          >
            Agendar Novo Vídeo
          </Button>
          
          {showVideoSelector && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg">
              <p className="text-gray-500 text-sm mb-2">
                Selecione um vídeo da sua biblioteca para agendar:
              </p>
              <p className="text-xs text-gray-400">
                (Funcionalidade não disponível nesta demonstração)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
