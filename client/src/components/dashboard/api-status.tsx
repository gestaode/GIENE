import { 
  Image, 
  Mic, 
  Bot, 
  Video,
  ServerCrash,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type ApiServiceType = "pexels" | "google_tts" | "openai" | "ffmpeg" | "mistral" | "huggingface" | "tts_service";

export interface ApiServiceStatus {
  id?: number;
  service: ApiServiceType;
  name: string;
  status: "connected" | "error" | "not_configured";
  icon: React.ReactNode;
}

export function ApiStatus() {
  const { toast } = useToast();
  
  const { data: apiSettings, isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: ["/api/settings"],
  });
  
  const { data: serviceStatus, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ["/api/settings/services/status"],
  });
  
  const isLoading = settingsLoading || statusLoading;
  const hasError = settingsError || statusError;
  
  // Fetch service statuses from API settings
  const apiServices: ApiServiceStatus[] = [
    {
      service: "pexels",
      name: "Pexels API",
      status: getApiStatus("pexels"),
      icon: <Image size={18} />,
    },
    {
      service: "google_tts",
      name: "Google TTS",
      status: getApiStatus("google_tts"),
      icon: <Mic size={18} />,
    },
    {
      service: "openai",
      name: "OpenAI GPT-4",
      status: getApiStatus("openai"),
      icon: <Bot size={18} />,
    },
    {
      service: "mistral",
      name: "Mistral AI",
      status: getApiStatus("mistral"),
      icon: <Bot size={18} />,
    },
    {
      service: "huggingface",
      name: "HuggingFace",
      status: getApiStatus("huggingface"),
      icon: <Bot size={18} />,
    },
    {
      service: "ffmpeg",
      name: "FFmpeg",
      status: "connected", // For demo purposes we'll assume FFmpeg is installed
      icon: <Video size={18} />,
    },
  ];

  // Helper function to get API status from settings
  function getApiStatus(service: ApiServiceType): "connected" | "error" | "not_configured" {
    if (isLoading || hasError) return "not_configured";
    
    // First check API service status
    if (serviceStatus && serviceStatus.services) {
      const serviceItem = serviceStatus.services.find((s: any) => s.name === service);
      if (serviceItem && serviceItem.status === 'connected') {
        return "connected";
      }
    }
    
    // Then check configured settings
    const setting = apiSettings?.find((s: any) => s.service === service);
    if (!setting) return "not_configured";
    
    return setting.isActive ? "connected" : "error";
  }

  // Function to get status indicator based on status
  function getStatusIndicator(status: "connected" | "error" | "not_configured") {
    switch (status) {
      case "connected":
        return (
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-green-600">Conectado</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="text-sm text-red-600">Erro</span>
          </div>
        );
      case "not_configured":
        return (
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span className="text-sm text-yellow-600">Configurar</span>
          </div>
        );
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-medium text-lg">Status das APIs</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ServerCrash size={32} className="text-red-500 mb-2" />
            <h4 className="text-lg font-medium text-gray-900 mb-1">Erro ao carregar status</h4>
            <p className="text-gray-500 mb-4">Não foi possível carregar o status das APIs</p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-medium text-lg">Status das APIs</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {apiServices.map((service) => (
            <div key={service.service} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  {service.icon}
                </div>
                <span className="font-medium">{service.name}</span>
              </div>
              {getStatusIndicator(service.status)}
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <Link href="/settings">
            <Button className="w-full">
              Gerenciar APIs
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
