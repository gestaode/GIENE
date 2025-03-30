import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiForm } from "@/components/api-settings/api-form";
import { SocialMediaForm } from "@/components/api-settings/social-media-form";
import { useApiSettings } from "@/hooks/use-api-settings";
import { Image, Mic, Bot, Video, Instagram, Sparkles, Brain } from "lucide-react";
import { BrandTiktok } from "@/components/ui/brand-icons";

function PageHeader() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <h2 className="font-bold text-xl text-gray-800">Configurações</h2>
      </div>
    </header>
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
