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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ContentFormProps {
  theme: string;
  onContentGenerated: (content: {
    title: string;
    script: string;
    description: string;
    tags: string[];
  }) => void;
}

const contentFormSchema = z.object({
  targetAudience: z.string().min(1, "Selecione o público-alvo"),
  duration: z.number().min(15).max(180),
  tone: z.string().min(1, "Selecione o tom do vídeo"),
  keywords: z.string().optional(),
  additionalInstructions: z.string().optional(),
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

export function ContentForm({ theme, onContentGenerated }: ContentFormProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      targetAudience: "general",
      duration: 60,
      tone: "informative",
      keywords: "",
      additionalInstructions: "",
    },
  });
  
  const onSubmit = async (values: ContentFormValues) => {
    if (!theme) {
      toast({
        title: "Tema não selecionado",
        description: "Por favor, selecione um tema antes de gerar o conteúdo",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Convert keywords string to array
      const keywordsArray = values.keywords
        ? values.keywords.split(",").map(k => k.trim()).filter(Boolean)
        : [];
      
      // Generate script with OpenAI
      const scriptResponse = await apiRequest("POST", "/api/openai/generate-script", {
        theme,
        targetAudience: values.targetAudience,
        duration: values.duration,
        tone: values.tone,
        keywords: keywordsArray,
        additionalInstructions: values.additionalInstructions
      });
      
      const scriptData = await scriptResponse.json();
      
      // Generate social media content
      const contentResponse = await apiRequest("POST", "/api/openai/generate-content", {
        theme,
        script: scriptData.fullScript,
        options: {
          title: true,
          description: true,
          hashtags: true,
          count: 5
        }
      });
      
      const contentData = await contentResponse.json();
      
      // Combine the data
      onContentGenerated({
        title: contentData.title || scriptData.title,
        script: scriptData.fullScript,
        description: contentData.description || "",
        tags: contentData.hashtags || [],
      });
      
      toast({
        title: "Conteúdo gerado com sucesso!",
        description: "Seu script e conteúdo para redes sociais foram criados.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar conteúdo",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar o conteúdo, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h4 className="font-medium text-lg mb-4">Configure o conteúdo para o tema: <span className="text-primary-600">{theme}</span></h4>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="targetAudience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Público-alvo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o público-alvo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="beginners">Iniciantes</SelectItem>
                    <SelectItem value="intermediate">Intermediários</SelectItem>
                    <SelectItem value="advanced">Avançados</SelectItem>
                    <SelectItem value="professionals">Profissionais</SelectItem>
                    <SelectItem value="students">Estudantes</SelectItem>
                    <SelectItem value="entrepreneurs">Empreendedores</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração do vídeo (segundos): {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={15}
                    max={180}
                    step={15}
                    defaultValue={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                </FormControl>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>15s</span>
                  <span>60s</span>
                  <span>180s</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tom do vídeo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tom do vídeo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="informative">Informativo</SelectItem>
                    <SelectItem value="educational">Educacional</SelectItem>
                    <SelectItem value="entertaining">Divertido</SelectItem>
                    <SelectItem value="motivational">Motivacional</SelectItem>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="friendly">Amigável</SelectItem>
                    <SelectItem value="persuasive">Persuasivo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="keywords"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Palavras-chave (separadas por vírgula)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: investimentos, dinheiro, finanças" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="additionalInstructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instruções adicionais (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Detalhes específicos que você gostaria de incluir no vídeo"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando conteúdo...
              </>
            ) : (
              "Gerar conteúdo"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
