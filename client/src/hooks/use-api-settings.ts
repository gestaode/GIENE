import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type ApiService = 
  | "pexels" 
  | "google_tts" 
  | "openai" 
  | "ffmpeg" 
  | "tiktok" 
  | "instagram";

export interface ApiSetting {
  id: number;
  userId: number;
  service: ApiService;
  apiKey: string;
  isActive: boolean;
}

export function useApiSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { 
    data: apiSettings, 
    isLoading, 
    error 
  } = useQuery<ApiSetting[]>({
    queryKey: ["/api/settings"],
  });

  const saveApiSettingMutation = useMutation({
    mutationFn: async (data: { service: ApiService; apiKey: string; isActive: boolean }) => {
      const response = await apiRequest("POST", "/api/settings", {
        ...data,
        userId: 1, // Demo user ID
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações da API foram salvas com sucesso.",
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
    mutationFn: async (data: { service: ApiService; apiKey: string }) => {
      const response = await apiRequest("POST", "/api/settings/test", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.isValid) {
        toast({
          title: "Teste bem-sucedido",
          description: data.message || "API conectada com sucesso.",
        });
      } else {
        toast({
          title: "Teste falhou",
          description: data.message || "Não foi possível conectar com a API.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao testar API",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao testar a API.",
        variant: "destructive",
      });
    },
  });

  const getApiSettingByService = (service: ApiService) => {
    return apiSettings?.find(setting => setting.service === service);
  };

  const isApiConfigured = (service: ApiService) => {
    const setting = getApiSettingByService(service);
    return !!(setting?.apiKey && setting?.isActive);
  };

  return {
    apiSettings,
    isLoading,
    error,
    saveApiSetting: saveApiSettingMutation.mutate,
    isSaving: saveApiSettingMutation.isPending,
    testApi: testApiMutation.mutate,
    isTesting: testApiMutation.isPending,
    getApiSettingByService,
    isApiConfigured,
  };
}
