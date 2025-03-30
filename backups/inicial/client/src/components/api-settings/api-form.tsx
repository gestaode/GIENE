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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Check, Loader2, X } from "lucide-react";

const apiSchema = z.object({
  apiKey: z.string().min(1, { message: "A chave de API é obrigatória" }),
  isActive: z.boolean().default(true),
});

type ApiFormValues = z.infer<typeof apiSchema>;

interface ApiFormProps {
  service: "pexels" | "google_tts" | "openai" | "ffmpeg" | "mistral" | "huggingface" | "tts_service";
  label: string;
  description: string;
  docsUrl: string;
  existingSettings?: {
    id: number;
    apiKey: string;
    isActive: boolean;
  };
}

export function ApiForm({
  service,
  label,
  description,
  docsUrl,
  existingSettings,
}: ApiFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  const form = useForm<ApiFormValues>({
    resolver: zodResolver(apiSchema),
    defaultValues: {
      apiKey: existingSettings?.apiKey || "",
      isActive: existingSettings?.isActive ?? true,
    },
  });

  const saveApiMutation = useMutation({
    mutationFn: async (data: ApiFormValues) => {
      const response = await apiRequest("POST", "/api/settings", {
        ...data,
        service,
        userId: 1, // Demo user ID
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Configurações salvas",
        description: `As configurações da API ${label} foram salvas com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar configurações",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar as configurações da API.",
        variant: "destructive",
      });
    },
  });

  const testApiMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      const response = await apiRequest("POST", "/api/settings/test", {
        service,
        apiKey,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setTestResult({
        isValid: data.isValid,
        message: data.message,
      });
      
      if (data.isValid) {
        toast({
          title: "Teste bem-sucedido",
          description: data.message,
        });
      } else {
        toast({
          title: "Teste falhou",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      setTestResult({
        isValid: false,
        message: error instanceof Error ? error.message : "Ocorreu um erro ao testar a API.",
      });
      
      toast({
        title: "Erro ao testar API",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao testar a API.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsTestingApi(false);
    },
  });

  const onSubmit = (data: ApiFormValues) => {
    saveApiMutation.mutate(data);
  };

  const handleTestApi = () => {
    const apiKey = form.getValues("apiKey");
    if (!apiKey) {
      toast({
        title: "Campo vazio",
        description: "Por favor, informe a chave de API antes de testar.",
        variant: "destructive",
      });
      return;
    }
    
    setIsTestingApi(true);
    setTestResult(null);
    testApiMutation.mutate(apiKey);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-800 mb-1">{label}</h4>
        <p className="text-sm text-gray-500 mb-3">{description}</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center space-x-4">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={`Insira sua chave API do ${label}`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit"
              disabled={saveApiMutation.isPending}
            >
              {saveApiMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={handleTestApi}
              disabled={isTestingApi || !form.getValues("apiKey")}
            >
              {isTestingApi ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar"
              )}
            </Button>
          </div>
        </form>
      </Form>
      
      {testResult && (
        <div className={`flex items-center p-2 rounded-md ${
          testResult.isValid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {testResult.isValid ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <X className="h-4 w-4 mr-2" />
          )}
          <span className="text-sm">{testResult.message}</span>
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        Obtenha sua chave API em{" "}
        <a
          href={docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:underline"
        >
          {docsUrl.replace("https://", "")}
        </a>
      </p>
    </div>
  );
}
