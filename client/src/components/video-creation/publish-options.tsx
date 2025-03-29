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
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PublishOptionsProps {
  videoUrl: string;
  videoDetails: {
    title: string;
    description: string;
    tags: string[];
  };
  onPublish: (data: {
    title: string;
    description: string;
    tags: string[];
    publishDate?: Date;
    platforms: string[];
  }) => void;
}

const publishFormSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  tags: z.string().optional(),
  scheduledDate: z.date().optional(),
  scheduledTime: z.string().optional(),
  platforms: z.array(z.string()).min(1, "Selecione pelo menos uma plataforma")
});

type PublishFormValues = z.infer<typeof publishFormSchema>;

export function PublishOptions({ videoUrl, videoDetails, onPublish }: PublishOptionsProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  
  const form = useForm<PublishFormValues>({
    resolver: zodResolver(publishFormSchema),
    defaultValues: {
      title: videoDetails.title,
      description: videoDetails.description,
      tags: videoDetails.tags.join(", "),
      platforms: ["tiktok", "instagram"]
    }
  });
  
  const handlePublish = async (values: PublishFormValues) => {
    setIsPublishing(true);
    
    try {
      // Process the form data
      let publishDate;
      
      if (showSchedule && values.scheduledDate && values.scheduledTime) {
        const [hours, minutes] = values.scheduledTime.split(":").map(Number);
        publishDate = new Date(values.scheduledDate);
        publishDate.setHours(hours, minutes, 0, 0);
      }
      
      const tags = values.tags?.split(",").map(tag => tag.trim()).filter(Boolean) || [];
      
      onPublish({
        title: values.title,
        description: values.description,
        tags,
        publishDate,
        platforms: values.platforms
      });
      
      toast({
        title: showSchedule ? "Vídeo agendado com sucesso" : "Vídeo publicado com sucesso",
        description: showSchedule 
          ? "Seu vídeo foi agendado e será publicado automaticamente na data definida." 
          : "Seu vídeo foi enviado para as plataformas selecionadas.",
      });
    } catch (error) {
      toast({
        title: "Erro ao publicar vídeo",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao publicar seu vídeo.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h4 className="font-medium text-lg mb-4">Publicação do vídeo</h4>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Informações para publicação</CardTitle>
              <CardDescription>
                Configure as informações que serão exibidas nas redes sociais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handlePublish)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título do vídeo</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite um título atrativo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva o conteúdo do seu vídeo" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hashtags (separadas por vírgula)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: finanças, investimentos, dinheiro" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="platforms"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
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
                                  <FormLabel className="font-normal cursor-pointer">
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
                                  <FormLabel className="font-normal cursor-pointer">
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
                  
                  <div className="flex items-center space-x-2 my-6">
                    <Checkbox
                      id="schedule"
                      checked={showSchedule}
                      onCheckedChange={(checked) => {
                        setShowSchedule(checked === true);
                      }}
                    />
                    <label
                      htmlFor="schedule"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Agendar publicação
                    </label>
                  </div>
                  
                  {showSchedule && (
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
                                      format(field.value, "PPP", { locale: ptBR })
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
                                  disabled={(date) => date < new Date()}
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
                  )}
                  
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isPublishing}
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {showSchedule ? "Agendando..." : "Publicando..."}
                        </>
                      ) : (
                        showSchedule ? "Agendar publicação" : "Publicar agora"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Prévia</CardTitle>
              <CardDescription>
                Visualize como seu vídeo ficará nas redes sociais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <span className="text-sm font-medium">Seu perfil • TikTok</span>
                  </div>
                  
                  <div className="aspect-[9/16] bg-gray-200 rounded-lg mb-3 overflow-hidden">
                    {videoUrl && (
                      <video 
                        src={videoUrl} 
                        className="w-full h-full object-cover"
                        controls
                      />
                    )}
                  </div>
                  
                  <p className="text-sm font-medium mb-1">
                    {form.watch("title") || videoDetails.title}
                  </p>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {form.watch("description") || videoDetails.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {(form.watch("tags") || videoDetails.tags.join(", "))
                      .split(",")
                      .map(tag => tag.trim())
                      .filter(Boolean)
                      .map((tag, index) => (
                        <span 
                          key={index}
                          className="text-xs text-primary-600"
                        >
                          #{tag}
                        </span>
                      ))
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
