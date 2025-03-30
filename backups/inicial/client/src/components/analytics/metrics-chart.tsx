import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subDays, subMonths, subYears, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface MetricsChartProps {
  data: VideoAnalytics[];
  timeRange: string;
}

export function MetricsChart({ data, timeRange }: MetricsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>("views");
  
  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    let cutoffDate;
    
    switch (timeRange) {
      case "week":
        cutoffDate = subDays(now, 7);
        break;
      case "month":
        cutoffDate = subMonths(now, 1);
        break;
      case "year":
        cutoffDate = subYears(now, 1);
        break;
      default:
        cutoffDate = subDays(now, 7);
    }
    
    return data.filter(item => {
      const itemDate = parseISO(item.date);
      return itemDate >= cutoffDate;
    });
  }, [data, timeRange]);
  
  // Format chart data
  const chartData = useMemo(() => {
    if (filteredData.length === 0) return [];
    
    // Group by date and platform
    const groupedByDate = filteredData.reduce((acc, item) => {
      const dateStr = format(parseISO(item.date), "yyyy-MM-dd");
      
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
        };
      }
      
      acc[dateStr].views += item.views;
      acc[dateStr].likes += item.likes;
      acc[dateStr].comments += item.comments;
      acc[dateStr].shares += item.shares;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert to array and sort by date
    return Object.values(groupedByDate).sort((a, b) => 
      a.date.localeCompare(b.date)
    );
  }, [filteredData]);
  
  // Format date for X-axis
  const formatXAxis = (dateStr: string) => {
    const date = parseISO(dateStr);
    
    switch (timeRange) {
      case "week":
        return format(date, "E", { locale: ptBR });
      case "month":
        return format(date, "dd/MM", { locale: ptBR });
      case "year":
        return format(date, "MMM", { locale: ptBR });
      default:
        return format(date, "dd/MM", { locale: ptBR });
    }
  };
  
  // Get metrics color
  const getMetricColor = (metric: string) => {
    switch (metric) {
      case "views":
        return "#3B82F6"; // blue
      case "likes":
        return "#10B981"; // green
      case "comments":
        return "#F59E0B"; // amber
      case "shares":
        return "#8B5CF6"; // purple
      default:
        return "#3B82F6";
    }
  };
  
  // Get Y-axis domain
  const getYAxisDomain = () => {
    if (chartData.length === 0) return [0, 10];
    
    const max = Math.max(...chartData.map(item => item[selectedMetric]));
    return [0, Math.max(10, Math.ceil(max * 1.1))]; // Add 10% padding to max
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-800">Tendências</h4>
        
        <Select
          value={selectedMetric}
          onValueChange={setSelectedMetric}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Métrica" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="views">Visualizações</SelectItem>
            <SelectItem value="likes">Curtidas</SelectItem>
            <SelectItem value="comments">Comentários</SelectItem>
            <SelectItem value="shares">Compartilhamentos</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="h-80 w-full">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">Sem dados disponíveis para o período selecionado</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={getYAxisDomain()}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => [Number(value).toLocaleString(), 
                  selectedMetric === "views" ? "Visualizações" :
                  selectedMetric === "likes" ? "Curtidas" :
                  selectedMetric === "comments" ? "Comentários" : "Compartilhamentos"
                ]}
                labelFormatter={(label) => format(parseISO(label), "dd/MM/yyyy", { locale: ptBR })}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                name={
                  selectedMetric === "views" ? "Visualizações" :
                  selectedMetric === "likes" ? "Curtidas" :
                  selectedMetric === "comments" ? "Comentários" : "Compartilhamentos"
                }
                stroke={getMetricColor(selectedMetric)}
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
