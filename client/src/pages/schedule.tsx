import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, CalendarPlus } from "lucide-react";
import { CalendarView } from "@/components/schedule/calendar-view";
import { ScheduleForm } from "@/components/schedule/schedule-form";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface ScheduledVideo {
  id: number;
  title: string;
  description?: string;
  status: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  scheduledAt: string;
  platform: string[];
}

function PageHeader() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h2 className="font-bold text-xl text-gray-800">Agendamento</h2>
        <Link href="/create-video">
          <Button>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Agendar Novo Vídeo
          </Button>
        </Link>
      </div>
    </header>
  );
}

export default function Schedule() {
  const [selectedVideo, setSelectedVideo] = useState<ScheduledVideo | null>(null);

  // Fetch scheduled videos
  const { data: videos, isLoading, error } = useQuery<ScheduledVideo[]>({
    queryKey: ["/api/videos"],
    select: (data) => data.filter(video => 
      video.status === "scheduled" && video.scheduledAt
    ),
  });

  const handleSelectVideo = (video: ScheduledVideo) => {
    setSelectedVideo(video);
  };

  return (
    <>
      <PageHeader />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-medium text-lg">Calendário de Publicações</h3>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar agendamentos</h3>
                    <p className="text-gray-500">
                      Não foi possível carregar seus vídeos agendados. Tente novamente mais tarde.
                    </p>
                  </div>
                ) : (
                  <CalendarView 
                    scheduledVideos={videos || []} 
                    onSelectVideo={handleSelectVideo}
                  />
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-medium text-lg">
                  {selectedVideo ? "Detalhes do Agendamento" : "Agendar Publicação"}
                </h3>
              </div>
              <div className="p-6">
                <ScheduleForm 
                  selectedVideo={selectedVideo}
                  onClearSelection={() => setSelectedVideo(null)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
