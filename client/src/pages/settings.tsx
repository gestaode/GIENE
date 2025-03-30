import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiForm } from "@/components/api-settings/api-form";
import { SocialMediaForm } from "@/components/api-settings/social-media-form";
import { useApiSettings } from "@/hooks/use-api-settings";
import { Image, Mic, Bot, Video, Instagram, Sparkles, Brain, Plus, Key } from "lucide-react";
import { BrandTiktok } from "@/components/ui/brand-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

function PageHeader() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <h2 className="font-bold text-xl text-gray-800">Configurações</h2>
      </div>
    </header>
  );
}

function CustomApiForm() {
  const [apiName, setApiName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiType, setApiType] = useState("ai");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  
  const handleSaveCustomApi = async () => {
    if (!apiName || !apiKey) {
      alert("Por favor, preencha o nome da API e a chave API.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      await apiRequest("POST", "/api/settings", {
        service: apiName.toLowerCase().replace(/\s+/g, "_"),
        apiKey,
        apiUrl: apiUrl || undefined,
        apiType,
        userId: 1, // Demo user ID
        isActive: true,
        isCustom: true
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      
      // Limpar o formulário
      setApiName("");
      setApiKey("");
      setApiUrl("");
      setApiType("ai");
      
      alert("API personalizada adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar API personalizada:", error);
      alert("Erro ao salvar API personalizada. Verifique o console para detalhes.");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar API Personalizada</CardTitle>
        <CardDescription>Configure suas próprias APIs para uso no sistema</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome da API
          </label>
          <Input
            value={apiName}
            onChange={(e) => setApiName(e.target.value)}
            placeholder="Ex: Claude AI, Elevenlab, Stability AI"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de API
          </label>
          <Select value={apiType} onValueChange={setApiType}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha o tipo de API" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai">IA / Geração de Conteúdo</SelectItem>
              <SelectItem value="tts">Texto para Voz</SelectItem>
              <SelectItem value="image">Imagens</SelectItem>
              <SelectItem value="video">Vídeo</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL da API (opcional)
          </label>
          <Input
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="Ex: https://api.exemplo.com/v1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Deixe em branco para usar a URL padrão da API
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chave API
          </label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Sua chave API secreta"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSaveCustomApi}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Salvando..." : "Adicionar API Personalizada"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function CustomApiList({ apiSettings }) {
  const customApis = apiSettings?.filter(api => api.isCustom) || [];
  
  return (
    <div className="space-y-4">
      {customApis.length > 0 ? (
        customApis.map((api) => (
          <div 
            key={api.id} 
            className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <h4 className="font-medium">{api.service}</h4>
              <p className="text-sm text-gray-500">
                {api.apiType === "ai" && "IA / Geração de Conteúdo"}
                {api.apiType === "tts" && "Texto para Voz"}
                {api.apiType === "image" && "Imagens"}
                {api.apiType === "video" && "Vídeo"}
                {api.apiType === "other" && "Outro"}
              </p>
            </div>
            <div className="flex items-center text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Conectado
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Key className="mx-auto h-10 w-10 text-gray-300 mb-2" />
          <p>Nenhuma API personalizada configurada</p>
          <p className="text-sm">Use o formulário acima para adicionar suas próprias APIs</p>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { isLoading, apiSettings } = useApiSettings();
  
  return (
    <>
      <PageHeader />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-medium text-lg">Configuração de APIs</h3>
          </div>
          
          <div className="p-6">
            <Tabs defaultValue="media-apis" className="mb-4">
              <TabsList className="mb-4">
                <TabsTrigger value="media-apis">APIs de Mídia</TabsTrigger>
                <TabsTrigger value="custom-apis">APIs Personalizadas</TabsTrigger>
                <TabsTrigger value="social">Redes Sociais</TabsTrigger>
                <TabsTrigger value="advanced">Configurações Avançadas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="media-apis" className="space-y-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">APIs de Imagem</h3>
                  <div className="p-4 bg-blue-50 rounded-md mb-4">
                    <p className="text-sm text-blue-700">
                      Configure pelo menos uma API de imagens para buscar recursos visuais para seus vídeos.
                    </p>
                  </div>
                  
                  <ApiForm
                    service="pexels"
                    label="Pexels API"
                    description="Utilizado para buscar imagens e vídeos de alta qualidade para os seus vídeos."
                    docsUrl="https://www.pexels.com/api/"
                    existingSettings={apiSettings?.find(s => s.service === "pexels")}
                  />
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">APIs de Voz</h3>
                  <div className="p-4 bg-blue-50 rounded-md mb-4">
                    <p className="text-sm text-blue-700">
                      Configure pelo menos uma API de conversão de texto para voz para gerar narrações em português brasileiro.
                    </p>
                  </div>
                  
                  <ApiForm
                    service="google_tts"
                    label="Google Text-to-Speech"
                    description="Geração de áudio de alta qualidade em português com várias vozes para os vídeos."
                    docsUrl="https://cloud.google.com/text-to-speech"
                    existingSettings={apiSettings?.find(s => s.service === "google_tts")}
                  />
                  
                  <ApiForm
                    service="tts_service"
                    label="TTS Service (Alternativo)"
                    description="Serviço alternativo para geração de voz quando o Google TTS não estiver disponível."
                    docsUrl="https://github.com/coqui-ai/TTS"
                    existingSettings={apiSettings?.find(s => s.service === "tts_service")}
                  />
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">APIs de Inteligência Artificial</h3>
                  <div className="p-4 bg-blue-50 rounded-md mb-4">
                    <p className="text-sm text-blue-700">
                      Configure pelo menos uma das APIs de IA para geração automática de conteúdo. O sistema utilizará automaticamente as alternativas quando a API principal estiver indisponível.
                    </p>
                  </div>
                  
                  <ApiForm
                    service="openai"
                    label="OpenAI GPT-4"
                    description="Utilizado para gerar conteúdo de texto para os vídeos (títulos, descrições, hashtags)."
                    docsUrl="https://openai.com/api/"
                    existingSettings={apiSettings?.find(s => s.service === "openai")}
                  />
                  
                  <ApiForm
                    service="mistral"
                    label="Mistral AI"
                    description="API alternativa para geração de conteúdo, utilizada quando a OpenAI não está disponível."
                    docsUrl="https://mistral.ai/"
                    existingSettings={apiSettings?.find(s => s.service === "mistral")}
                  />
                  
                  <ApiForm
                    service="huggingface"
                    label="HuggingFace"
                    description="Utilizado para processamento de modelos de linguagem e geração de conteúdo."
                    docsUrl="https://huggingface.co/docs/api-inference/quicktour"
                    existingSettings={apiSettings?.find(s => s.service === "huggingface")}
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">FFmpeg (Processamento de Vídeo)</h4>
                    <p className="text-sm text-gray-500 mb-3">Usado para editar e combinar o áudio e as imagens geradas para criar os vídeos.</p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>FFmpeg instalado e configurado corretamente</span>
                    </div>
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition">
                      Verificar
                    </button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="custom-apis" className="space-y-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Configurar APIs Personalizadas</h3>
                  <div className="p-4 bg-blue-50 rounded-md mb-4">
                    <p className="text-sm text-blue-700">
                      Adicione suas próprias APIs ao sistema. Você pode configurar qualquer API externa para ser usada no processo de geração de vídeos.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CustomApiForm />
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-lg mb-2">APIs Personalizadas Configuradas</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Essas são as APIs personalizadas que você adicionou ao sistema.
                        </p>
                        <CustomApiList apiSettings={apiSettings} />
                      </div>
                      
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                        <h4 className="font-medium text-amber-800 mb-2">Dica de Uso</h4>
                        <p className="text-sm text-amber-700">
                          As APIs personalizadas são usadas automaticamente pelo sistema quando as APIs padrão não estão disponíveis ou retornam erros. Isso garante que seu sistema continue funcionando mesmo quando um provedor específico estiver com problemas.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="social">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SocialMediaForm
                    platform="tiktok"
                    icon={<BrandTiktok size={24} />}
                  />
                  
                  <SocialMediaForm
                    platform="instagram"
                    icon={<Instagram size={24} />}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="advanced">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Configurações de Armazenamento</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Configure onde os vídeos e outros arquivos gerados serão armazenados.
                    </p>
                    
                    <div className="flex items-center space-x-2 mb-4">
                      <input
                        type="radio"
                        id="storage-local"
                        name="storage"
                        defaultChecked
                      />
                      <label htmlFor="storage-local" className="text-gray-700">
                        Armazenamento Local
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="storage-s3"
                        name="storage"
                        disabled
                      />
                      <label htmlFor="storage-s3" className="text-gray-400">
                        Amazon S3 (Em breve)
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Configurações de FFmpeg</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Defina parâmetros avançados para o processamento de vídeo.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Resolução Padrão
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                          <option>1080x1920 (9:16)</option>
                          <option>720x1280 (9:16)</option>
                          <option>1080x1080 (1:1)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Qualidade de Vídeo
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                          <option>Alta</option>
                          <option>Média</option>
                          <option>Baixa</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Diretório de Saída</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Defina onde os vídeos serão salvos após o processamento.
                    </p>
                    
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue="./uploads/videos"
                        readOnly
                      />
                      <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition">
                        Alterar
                      </button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
