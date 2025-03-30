import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Search, 
  Image, 
  Video, 
  Mic, 
  Upload,
  Check,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface MediaSelectorProps {
  onSelectMedia: (media: {
    type: "image" | "video" | "audio";
    url: string;
    source: "pexels" | "upload";
    id?: string | number;
  }[]) => void;
  script: string;
}

export function MediaSelector({ onSelectMedia, script }: MediaSelectorProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaType, setMediaType] = useState<"photos" | "videos">("photos");
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const [voiceText, setVoiceText] = useState(script || "");
  const [voiceOptions, setVoiceOptions] = useState({
    languageCode: "pt-BR",
    voiceName: "pt-BR-Standard-A",
    speakingRate: 1.0,
    pitch: 0
  });
  const [generatedAudio, setGeneratedAudio] = useState<{ fileName: string; filePath: string; } | null>(null);

  // Pexels search query
  const { data: searchResults, isLoading: isSearching, refetch } = useQuery({
    queryKey: [`/api/pexels/search?query=${searchQuery}&type=${mediaType}`, searchQuery, mediaType],
    enabled: false,
  });

  // Generate speech mutation
  const { mutate: generateSpeech, isPending: isGeneratingSpeech } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/premium-brazilian-voice/synthesize", {
        text: voiceText,
        voice: voiceOptions.voiceName,
        speed: voiceOptions.speakingRate
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedAudio(data);
      toast({
        title: "Áudio gerado com sucesso",
        description: "Áudio de narração de alta qualidade em português brasileiro gerado com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar áudio",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar o áudio.",
        variant: "destructive"
      });
    }
  });

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      toast({
        title: "Busca vazia",
        description: "Digite um termo para buscar imagens ou vídeos.",
        variant: "destructive"
      });
      return;
    }
    refetch();
  }, [searchQuery, refetch, toast]);

  const handleSelectMedia = (item: any, type: "image" | "video") => {
    const isAlreadySelected = selectedMedia.some(
      m => (type === "image" ? m.id === item.id : m.id === item.id)
    );

    if (isAlreadySelected) {
      setSelectedMedia(selectedMedia.filter(
        m => (type === "image" ? m.id !== item.id : m.id !== item.id)
      ));
    } else {
      const mediaItem = {
        type,
        id: item.id,
        url: type === "image" ? item.src.medium : item.video_files[0].link,
        source: "pexels" as const,
        thumbnail: type === "image" ? item.src.small : item.image,
      };
      setSelectedMedia([...selectedMedia, mediaItem]);
    }
  };

  const handleGenerateSpeech = () => {
    if (!voiceText.trim()) {
      toast({
        title: "Texto vazio",
        description: "Digite o texto para gerar o áudio.",
        variant: "destructive"
      });
      return;
    }
    generateSpeech();
  };

  const handleContinue = () => {
    const mediaToSend = [...selectedMedia];
    
    if (generatedAudio) {
      mediaToSend.push({
        type: "audio" as const,
        url: generatedAudio.filePath,
        source: "upload" as const
      });
    }
    
    if (mediaToSend.length === 0) {
      toast({
        title: "Nenhuma mídia selecionada",
        description: "Selecione pelo menos uma imagem, vídeo ou gere um áudio para continuar.",
        variant: "destructive"
      });
      return;
    }
    
    onSelectMedia(mediaToSend);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h4 className="font-medium text-lg mb-4">Selecione as mídias para seu vídeo</h4>
      
      <Tabs defaultValue="search" className="mb-6">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="search">
            <Search className="mr-2 h-4 w-4" />
            Buscar no Pexels
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload de Arquivos
          </TabsTrigger>
          <TabsTrigger value="voice">
            <Mic className="mr-2 h-4 w-4" />
            Gerar Áudio
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="search">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar imagens ou vídeos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setMediaType("photos")}
                    variant={mediaType === "photos" ? "default" : "outline"}
                    size="icon"
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setMediaType("videos")}
                    variant={mediaType === "videos" ? "default" : "outline"}
                    size="icon"
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleSearch}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                  </Button>
                </div>
              </div>
              
              {isSearching ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {searchResults && (
                    mediaType === "photos" ? (
                      searchResults.photos?.map((photo: any) => (
                        <div 
                          key={photo.id}
                          className={`relative cursor-pointer rounded-lg overflow-hidden ${
                            selectedMedia.some(m => m.id === photo.id) ? 'ring-2 ring-primary-500' : ''
                          }`}
                          onClick={() => handleSelectMedia(photo, "image")}
                        >
                          <img 
                            src={photo.src.medium} 
                            alt={photo.alt || "Pexels image"} 
                            className="w-full h-40 object-cover"
                          />
                          {selectedMedia.some(m => m.id === photo.id) && (
                            <div className="absolute top-2 right-2 bg-primary-500 rounded-full p-1">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      searchResults.videos?.map((video: any) => (
                        <div 
                          key={video.id}
                          className={`relative cursor-pointer rounded-lg overflow-hidden ${
                            selectedMedia.some(m => m.id === video.id) ? 'ring-2 ring-primary-500' : ''
                          }`}
                          onClick={() => handleSelectMedia(video, "video")}
                        >
                          <img 
                            src={video.image} 
                            alt={video.url || "Pexels video"} 
                            className="w-full h-40 object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black bg-opacity-50 rounded-full p-2">
                              <Video className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          {selectedMedia.some(m => m.id === video.id) && (
                            <div className="absolute top-2 right-2 bg-primary-500 rounded-full p-1">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))
                    )
                  )}
                </div>
              )}
              
              {searchResults && (
                mediaType === "photos" ? (
                  !searchResults.photos?.length && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma imagem encontrada. Tente outra busca.
                    </div>
                  )
                ) : (
                  !searchResults.videos?.length && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum vídeo encontrado. Tente outra busca.
                    </div>
                  )
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upload">
          <Card>
            <CardContent className="pt-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Arraste arquivos ou clique para fazer upload</h3>
                <p className="text-sm text-gray-500 mb-4">Suporta JPG, PNG, MP4 (Máx. 100MB)</p>
                <Button>Selecionar arquivos</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="voice">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto para narração
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[120px]"
                    value={voiceText}
                    onChange={(e) => setVoiceText(e.target.value)}
                    placeholder="Digite o texto que será convertido em áudio..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Voz
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={voiceOptions.voiceName}
                      onChange={(e) => setVoiceOptions({...voiceOptions, voiceName: e.target.value})}
                    >
                      <option value="Ricardo Autoritativo">Ricardo Autoritativo (Masculina)</option>
                      <option value="Amanda Persuasiva">Amanda Persuasiva (Feminina)</option>
                      <option value="Carlos Especialista">Carlos Especialista (Masculina)</option>
                      <option value="Luciana Amigável">Luciana Amigável (Feminina)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Velocidade: {voiceOptions.speakingRate}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={voiceOptions.speakingRate}
                      onChange={(e) => setVoiceOptions({...voiceOptions, speakingRate: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Button 
                    onClick={handleGenerateSpeech}
                    disabled={isGeneratingSpeech || !voiceText.trim()}
                  >
                    {isGeneratingSpeech ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" />
                        Gerar áudio
                      </>
                    )}
                  </Button>
                  
                  {generatedAudio && (
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-green-600">Áudio gerado com sucesso</span>
                    </div>
                  )}
                </div>
                
                {generatedAudio && (
                  <div className="border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Mic className="h-4 w-4 text-primary-500 mr-2" />
                        <span className="text-sm font-medium">Narração gerada</span>
                      </div>
                      <audio controls src={generatedAudio.filePath} className="h-8" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between mt-6">
        <div className="flex items-center">
          <span className="text-sm font-medium mr-2">Mídias selecionadas:</span>
          <span className="bg-primary-100 text-primary-800 text-xs font-medium py-1 px-2 rounded">
            {selectedMedia.length} itens
          </span>
          {generatedAudio && (
            <span className="bg-green-100 text-green-800 text-xs font-medium py-1 px-2 rounded ml-2">
              1 áudio
            </span>
          )}
        </div>
        <Button onClick={handleContinue}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
