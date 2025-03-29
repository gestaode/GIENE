import { VideoPlayer } from "@/components/ui/video-player";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play, MoreVertical, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Video {
  id: number;
  title: string;
  description?: string;
  status: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

export function RecentVideos() {
  const { toast } = useToast();
  
  const { data: videos, isLoading, error } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
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
  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString);
      return `Criado: ${formatDistanceToNow(date, { addSuffix: true, locale: ptBR })}`;
    } catch (e) {
      return "Data inválida";
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-3">
                <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-medium text-lg">Vídeos Recentes</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle size={32} className="text-red-500 mb-2" />
            <h4 className="text-lg font-medium text-gray-900 mb-1">Erro ao carregar vídeos</h4>
            <p className="text-gray-500 mb-4">Não foi possível carregar seus vídeos recentes</p>
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
        <h3 className="font-medium text-lg">Vídeos Recentes</h3>
      </div>
      <div className="p-6">
        {videos && videos.length > 0 ? (
          <div className="space-y-4">
            {videos.slice(0, 3).map((video) => (
              <div key={video.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition">
                <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded overflow-hidden relative">
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <Play size={24} className="text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{video.title}</h4>
                  <p className="text-sm text-gray-500">{formatDate(video.createdAt)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(video.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Link href={`/videos/${video.id}`}>Ver detalhes</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Publicar</DropdownMenuItem>
                      <DropdownMenuItem>Agendar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Você ainda não tem vídeos criados</p>
            <Link href="/create-video">
              <Button>Criar seu primeiro vídeo</Button>
            </Link>
          </div>
        )}
        
        {videos && videos.length > 0 && (
          <div className="mt-4 text-center">
            <Link href="/library">
              <Button variant="link" className="text-primary-600 hover:text-primary-700">
                Ver todos os vídeos
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
