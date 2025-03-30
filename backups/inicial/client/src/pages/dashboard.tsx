import { useEffect } from "react";
import { 
  Film, 
  Share, 
  UserPlus, 
  Eye
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentVideos } from "@/components/dashboard/recent-videos";
import { ApiStatus } from "@/components/dashboard/api-status";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { CreationWizard } from "@/components/video-creation/creation-wizard";

function PageHeader() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h2 className="font-bold text-xl text-gray-800">Dashboard</h2>
        <div className="flex space-x-4 items-center">
          <button className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export default function Dashboard() {
  // Stats data
  const stats = [
    {
      title: "Vídeos Criados",
      value: "12",
      icon: Film,
      trend: 24,
      color: "blue",
    },
    {
      title: "Publicações",
      value: "8",
      icon: Share,
      trend: 12,
      color: "green",
    },
    {
      title: "Leads Capturados",
      value: "47",
      icon: UserPlus,
      trend: 32,
      color: "orange",
    },
    {
      title: "Visualizações",
      value: "1.2k",
      icon: Eye,
      trend: 18,
      color: "purple",
    },
  ];
  
  return (
    <>
      <PageHeader />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              color={stat.color as any}
            />
          ))}
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentVideos />
          </div>
          
          <div className="lg:col-span-1 space-y-8">
            <ApiStatus />
            <QuickActions />
          </div>
        </div>
      </div>
    </>
  );
}
