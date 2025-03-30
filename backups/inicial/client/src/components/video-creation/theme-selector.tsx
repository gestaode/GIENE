import { useState } from "react";
import { 
  Coins, 
  TrendingUp, 
  BookOpen, 
  Heart,
  Globe,
  ShoppingBag,
  Camera,
  Music
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ThemeOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface ThemeSelectorProps {
  selectedTheme: string;
  onThemeSelect: (theme: string) => void;
}

export function ThemeSelector({ selectedTheme, onThemeSelect }: ThemeSelectorProps) {
  const [customTheme, setCustomTheme] = useState("");
  
  const themes: ThemeOption[] = [
    {
      id: "finances",
      title: "Finanças Pessoais",
      description: "Dicas de economia, investimentos e gestão financeira",
      icon: <Coins size={24} />,
      color: "bg-primary-100 text-primary-600",
    },
    {
      id: "entrepreneurship",
      title: "Empreendedorismo",
      description: "Estratégias de negócios e oportunidades de mercado",
      icon: <TrendingUp size={24} />,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      id: "education",
      title: "Educação",
      description: "Conteúdo educacional e dicas de aprendizado",
      icon: <BookOpen size={24} />,
      color: "bg-orange-100 text-orange-600",
    },
    {
      id: "health",
      title: "Saúde e Bem-estar",
      description: "Dicas de saúde, exercícios e bem-estar mental",
      icon: <Heart size={24} />,
      color: "bg-primary-100 text-primary-600",
    },
    {
      id: "travel",
      title: "Viagens",
      description: "Destinos, dicas de viagem e experiências culturais",
      icon: <Globe size={24} />,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      id: "fashion",
      title: "Moda e Estilo",
      description: "Tendências, dicas de estilo e moda sustentável",
      icon: <ShoppingBag size={24} />,
      color: "bg-orange-100 text-orange-600",
    },
    {
      id: "photography",
      title: "Fotografia",
      description: "Dicas de fotografia e edição de imagens",
      icon: <Camera size={24} />,
      color: "bg-purple-100 text-purple-600",
    },
    {
      id: "music",
      title: "Música",
      description: "Dicas musicais, instrumentos e produção musical",
      icon: <Music size={24} />,
      color: "bg-pink-100 text-pink-600",
    },
  ];
  
  const handleCustomThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomTheme(e.target.value);
  };
  
  const handleCustomThemeSubmit = () => {
    if (customTheme.trim()) {
      onThemeSelect(customTheme);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h4 className="font-medium text-lg mb-4">Escolha um tema para seu vídeo</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {themes.map((theme) => (
          <div 
            key={theme.id}
            className={cn(
              "border rounded-lg p-4 cursor-pointer transition",
              selectedTheme === theme.title
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-primary-500 hover:bg-primary-50"
            )}
            onClick={() => onThemeSelect(theme.title)}
          >
            <div className="flex items-start">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mr-3",
                theme.color
              )}>
                {theme.icon}
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">{theme.title}</h5>
                <p className="text-sm text-gray-500">{theme.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mb-6">
        <Label htmlFor="custom-theme" className="block text-sm font-medium text-gray-700 mb-1">
          Ou crie um tema personalizado:
        </Label>
        <div className="flex space-x-2">
          <Input 
            id="custom-theme"
            value={customTheme}
            onChange={handleCustomThemeChange}
            placeholder="Ex: Marketing Digital, Tecnologia, etc."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleCustomThemeSubmit()}
          />
          <button
            onClick={handleCustomThemeSubmit}
            className={cn(
              "px-4 py-2 rounded-md transition",
              customTheme.trim()
                ? "bg-primary-600 hover:bg-primary-700 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
            disabled={!customTheme.trim()}
          >
            Usar
          </button>
        </div>
      </div>
    </div>
  );
}
