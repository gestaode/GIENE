import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  MoreVertical, 
  Search, 
  Filter, 
  Loader2, 
  Play, 
  FilePlus2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoPlayer } from "@/components/ui/video-player";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Video {
  id: number;
  title: string;
  description?: string;
  status: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  createdAt: string;
  publishedAt?: string;
  scheduledAt?: string;
  platform?: string[];
  theme: string;
  tags?: string[];
}

function PageHeader() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h2 className="font-bold text-xl text-gray-800">Biblioteca</h2>
        <Link href="/create-video">
          <Button>
            <FilePlus2 className="mr-2 h-4 w-4" />
            Novo Vídeo
          </Button>
        </Link>
      </div>
    </header>
  );
}

export default function Library() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const { data: videos, isLoading, error } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });
  
  // Filter videos based on search query and status filter
  const filteredVideos = videos?.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (video.theme && video.theme.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter ? video.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });
  
  // Function to get status badge
  function getStatusBadge(status: string) {
    switch (status) {
      case "published":
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Publicado</span>;
      case "scheduled":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Agendado</span>;
      case "processing":
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Processando</span>;
      case "ready":
        return <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">Pronto</span>;
      default:
        return <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">Rascunho</span>;
    }
  }
  
  // Format date
  function formatDate(dateString?: string) {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "dd/MM/yyyy - HH:mm", { locale: ptBR });
    } catch (e) {
      return "Data inválida";
    }
  }
  
  const handleOpenPreview = (video: Video) => {
    setSelectedVideo(video);
    setIsPreviewOpen(true);
  };
  
  const handleClosePreview = () => {
    setIsPreviewOpen(false);
  };
  
  return (
    <>
      <PageHeader />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-medium text-lg">Seus Vídeos</h3>
              
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar vídeos..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                      Todos
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter("published")}>
                      Publicados
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("scheduled")}>
                      Agendados
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
                      Rascunhos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("processing")}>
                      Processando
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("ready")}>
                      Pronto
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar vídeos</h3>
                <p className="text-gray-500">
                  Não foi possível carregar seus vídeos. Tente novamente mais tarde.
                </p>
              </div>
            ) : filteredVideos && filteredVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <div 
                      className="aspect-video bg-gray-200 relative cursor-pointer"
                      onClick={() => handleOpenPreview(video)}
                    >
                      {video.thumbnailUrl ? (
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          <Play size={32} className="text-gray-500" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2">
                        {getStatusBadge(video.status)}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-800 line-clamp-1">{video.title}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenPreview(video)}>
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Duplicar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Publicar</DropdownMenuItem>
                            <DropdownMenuItem>Agendar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {video.description || "Sem descrição"}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {video.tags && video.tags.slice(0, 3).map((tag, i) => (
                          <span 
                            key={i}
                            className="bg-gray-100 text-gray-800 text-xs py-1 px-2 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                        {video.tags && video.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{video.tags.length - 3}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <p>Criado: {formatDate(video.createdAt)}</p>
                        {video.status === "published" && video.publishedAt && (
                          <p>Publicado: {formatDate(video.publishedAt)}</p>
                        )}
                        {video.status === "scheduled" && video.scheduledAt && (
                          <p>Agendado: {formatDate(video.scheduledAt)}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || statusFilter
                    ? "Nenhum vídeo encontrado para esta busca"
                    : "Você ainda não tem vídeos"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || statusFilter
                    ? "Tente usar termos diferentes ou remover os filtros"
                    : "Comece criando seu primeiro vídeo"}
                </p>
                {!searchQuery && !statusFilter && (
                  <Link href="/create-video">
                    <Button>
                      <FilePlus2 className="mr-2 h-4 w-4" />
                      Criar novo vídeo
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Video Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={handleClosePreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
            <DialogDescription>
              {getStatusBadge(selectedVideo?.status || "draft")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVideo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {selectedVideo.videoUrl ? (
                  <VideoPlayer
                    src={selectedVideo.videoUrl}
                    poster={selectedVideo.thumbnailUrl}
                  />
                ) : (
                  <div className="aspect-video bg-gray-200 flex items-center justify-center rounded-lg">
                    <Play size={48} className="text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Descrição</h4>
                  <p className="text-gray-700">{selectedVideo.description || "Sem descrição"}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Tags</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedVideo.tags && selectedVideo.tags.map((tag, i) => (
                      <span 
                        key={i}
                        className="bg-gray-100 text-gray-800 text-xs py-1 px-2 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                    {(!selectedVideo.tags || selectedVideo.tags.length === 0) && (
                      <span className="text-gray-400 text-sm">Sem tags</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Plataformas</h4>
                  <div className="flex gap-2 mt-1">
                    {selectedVideo.platform && selectedVideo.platform.includes("tiktok") && (
                      <span className="bg-black text-white text-xs py-1 px-2 rounded">
                        TikTok
                      </span>
                    )}
                    {selectedVideo.platform && selectedVideo.platform.includes("instagram") && (
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs py-1 px-2 rounded">
                        Instagram
                      </span>
                    )}
                    {(!selectedVideo.platform || selectedVideo.platform.length === 0) && (
                      <span className="text-gray-400 text-sm">Sem plataformas</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Datas</h4>
                  <p className="text-xs text-gray-700 mt-1">
                    <span className="block">Criado: {formatDate(selectedVideo.createdAt)}</span>
                    {selectedVideo.publishedAt && (
                      <span className="block">Publicado: {formatDate(selectedVideo.publishedAt)}</span>
                    )}
                    {selectedVideo.scheduledAt && (
                      <span className="block">Agendado: {formatDate(selectedVideo.scheduledAt)}</span>
                    )}
                  </p>
                </div>
                
                <div className="pt-4 flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    Editar
                  </Button>
                  {selectedVideo.status === "draft" || selectedVideo.status === "ready" ? (
                    <Button className="flex-1">
                      Publicar
                    </Button>
                  ) : selectedVideo.status === "scheduled" ? (
                    <Button variant="destructive" className="flex-1">
                      Cancelar agendamento
                    </Button>
                  ) : (
                    <Button variant="destructive" className="flex-1">
                      Excluir
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
