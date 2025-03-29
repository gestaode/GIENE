import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { BadgeCheck, Instagram } from "lucide-react";
import { BrandTiktok } from "@/components/ui/brand-icons";

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

interface CalendarViewProps {
  scheduledVideos: ScheduledVideo[];
  onSelectVideo: (video: ScheduledVideo) => void;
}

export function CalendarView({ scheduledVideos, onSelectVideo }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Format date for comparison
  const formatDateForComparison = (date: Date) => {
    return format(date, "yyyy-MM-dd");
  };
  
  // Get videos scheduled for the selected date
  const getVideosForDate = (date: Date) => {
    const formattedDate = formatDateForComparison(date);
    return scheduledVideos.filter(video => {
      const videoDate = formatDateForComparison(new Date(video.scheduledAt));
      return videoDate === formattedDate;
    });
  };
  
  // Handle date change
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };
  
  // Get dates with scheduled videos for calendar highlighting
  const getDatesWithVideos = () => {
    return scheduledVideos.map(video => new Date(video.scheduledAt));
  };
  
  // Custom day render function to highlight days with scheduled videos
  const renderDay = (day: Date) => {
    const hasVideos = getDatesWithVideos().some(videoDate => 
      formatDateForComparison(videoDate) === formatDateForComparison(day)
    );
    
    return hasVideos ? (
      <div className="relative">
        <div className="absolute bottom-0 right-0">
          <BadgeCheck className="h-3 w-3 text-primary-500" />
        </div>
      </div>
    ) : null;
  };
  
  // Get time part from date string
  const getTimeFromDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "HH:mm");
  };
  
  // Scheduled videos for selected date
  const videosForSelectedDate = selectedDate ? getVideosForDate(selectedDate) : [];
  
  return (
    <div className="space-y-6">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
        locale={ptBR}
        className="rounded-md border"
        components={{
          DayContent: (props) => (
            <>
              {props.day.toString()}
              {renderDay(props.date)}
            </>
          ),
        }}
      />
      
      <div className="space-y-2">
        <h4 className="font-medium text-gray-800">
          {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </h4>
        
        {videosForSelectedDate.length > 0 ? (
          <div className="space-y-2">
            {videosForSelectedDate.map(video => (
              <Card 
                key={video.id} 
                className="cursor-pointer hover:border-primary-300 transition-colors"
                onClick={() => onSelectVideo(video)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-800 line-clamp-1">{video.title}</h5>
                      <p className="text-sm text-gray-500">{getTimeFromDate(video.scheduledAt)}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {video.platform.includes("tiktok") && (
                        <div className="bg-black text-white p-1 rounded-full">
                          <BrandTiktok size={16} />
                        </div>
                      )}
                      {video.platform.includes("instagram") && (
                        <div className="bg-gradient-to-tr from-purple-500 to-pink-500 text-white p-1 rounded-full">
                          <Instagram size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 py-4 text-center">
            Nenhum vídeo agendado para esta data.
          </p>
        )}
      </div>
    </div>
  );
}
