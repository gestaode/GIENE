import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MetricsChart } from "@/components/analytics/metrics-chart";
import { PlatformBreakdown } from "@/components/analytics/platform-breakdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";

interface VideoAnalytics {
  id: number;
  videoId: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  platform: string;
  date: string;
}

interface Video {
  id: number;
  title: string;
  status: string;
}

function PageHeader() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <h2 className="font-bold text-xl text-gray-800">Analytics</h2>
      </div>
    </header>
  );
}

export default function Analytics() {
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<string>("week");
  
  // Get all videos
  const { 
    data: videos, 
    isLoading: isLoadingVideos 
  } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
    select: (data) => data.filter(video => video.status === "published"),
  });
  
  // Get analytics data
  const {
    data: analyticsData,
    isLoading: isLoadingAnalytics,
    error: analyticsError,
  } = useQuery<VideoAnalytics[]>({
    queryKey: ["/api/analytics", selectedVideoId],
    enabled: !!selectedVideoId,
  });
  
  // Handle video selection
  const handleVideoChange = (videoId: string) => {
    setSelectedVideoId(Number(videoId));
  };
  
  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };
  
  // Calculate total stats
  const calculateTotalStats = () => {
    if (!analyticsData) return { views: 0, likes: 0, comments: 0, shares: 0 };
    
    return analyticsData.reduce(
      (totals, item) => {
        return {
          views: totals.views + item.views,
          likes: totals.likes + item.likes,
          comments: totals.comments + item.comments,
          shares: totals.shares + item.shares,
        };
      },
      { views: 0, likes: 0, comments: 0, shares: 0 }
    );
  };
  
  const totals = calculateTotalStats();
  
  return (
    <>
      <PageHeader />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="font-medium text-lg">Desempenho dos Vídeos</h3>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Select
                  value={selectedVideoId?.toString() || ""}
                  onValueChange={handleVideoChange}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Selecione um vídeo" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingVideos ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary-500 mr-2" />
                        <span>Carregando vídeos...</span>
                      </div>
                    ) : videos && videos.length > 0 ? (
                      videos.map((video) => (
                        <SelectItem key={video.id} value={video.id.toString()}>
                          {video.title}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-gray-500">
                        Nenhum vídeo publicado
                      </div>
                    )}
                  </SelectContent>
                </Select>
                
                <Select
                  value={timeRange}
                  onValueChange={handleTimeRangeChange}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Último mês</SelectItem>
                    <SelectItem value="year">Último ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {!selectedVideoId ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione um vídeo</h3>
                <p className="text-gray-500">
                  Escolha um vídeo publicado para visualizar suas métricas.
                </p>
              </div>
            ) : isLoadingAnalytics ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : analyticsError ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h3>
                <p className="text-gray-500">
                  Não foi possível carregar os dados de analytics. Tente novamente mais tarde.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Visualizações</h4>
                    <p className="text-2xl font-bold text-gray-800">{totals.views.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Curtidas</h4>
                    <p className="text-2xl font-bold text-gray-800">{totals.likes.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Comentários</h4>
                    <p className="text-2xl font-bold text-gray-800">{totals.comments.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Compartilhamentos</h4>
                    <p className="text-2xl font-bold text-gray-800">{totals.shares.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <MetricsChart 
                      data={analyticsData || []} 
                      timeRange={timeRange} 
                    />
                  </div>
                  
                  <div className="lg:col-span-1">
                    <PlatformBreakdown 
                      data={analyticsData || []} 
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
