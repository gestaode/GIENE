import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Instagram } from "lucide-react";
import { BrandTiktok } from "@/components/ui/brand-icons";

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

interface PlatformBreakdownProps {
  data: VideoAnalytics[];
}

export function PlatformBreakdown({ data }: PlatformBreakdownProps) {
  // Calculate platform breakdown
  const platformData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Group metrics by platform
    const platforms = data.reduce((acc, item) => {
      const platform = item.platform;
      
      if (!acc[platform]) {
        acc[platform] = {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          engagementRate: 0,
        };
      }
      
      acc[platform].views += item.views;
      acc[platform].likes += item.likes;
      acc[platform].comments += item.comments;
      acc[platform].shares += item.shares;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Calculate engagement rate for each platform
    Object.keys(platforms).forEach(platform => {
      const { views, likes, comments, shares } = platforms[platform];
      platforms[platform].engagementRate = views > 0 
        ? ((likes + comments + shares) / views) * 100 
        : 0;
    });
    
    // Convert to array format for charts
    return Object.keys(platforms).map(platform => ({
      name: platform === "tiktok" ? "TikTok" : "Instagram",
      value: platforms[platform].views,
      likes: platforms[platform].likes,
      comments: platforms[platform].comments,
      shares: platforms[platform].shares,
      engagementRate: platforms[platform].engagementRate.toFixed(2),
    }));
  }, [data]);
  
  // Chart colors
  const COLORS = ["#000000", "#E1306C"];
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
          <p className="font-medium text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">Visualizações: {data.value.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Curtidas: {data.likes.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Comentários: {data.comments.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Compartilhamentos: {data.shares.toLocaleString()}</p>
          <p className="text-sm text-gray-600">
            Taxa de engajamento: {data.engagementRate}%
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div>
      <h4 className="font-medium text-gray-800 mb-4">Desempenho por Plataforma</h4>
      
      <div className="h-80 w-full">
        {platformData.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">Sem dados disponíveis</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={platformData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      
      <div className="mt-4 grid grid-cols-1 gap-4">
        {platformData.map((platform, index) => (
          <div 
            key={platform.name} 
            className="p-3 rounded-lg border border-gray-200"
          >
            <div className="flex items-center space-x-2 mb-2">
              {platform.name === "TikTok" ? (
                <BrandTiktok size={20} />
              ) : (
                <Instagram size={20} />
              )}
              <h5 className="font-medium">{platform.name}</h5>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500">Visualizações</p>
                <p className="font-medium">{platform.value.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Taxa de engajamento</p>
                <p className="font-medium">{platform.engagementRate}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
