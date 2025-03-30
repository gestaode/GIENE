import { 
  PlusCircle, 
  CalendarPlus, 
  TrendingUp, 
  Settings, 
  Download,
  LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  href: string;
  colorClass: string;
}

function QuickAction({ icon: Icon, label, href, colorClass }: QuickActionProps) {
  return (
    <Link href={href}>
      <button className={cn(
        "p-4 rounded-lg flex flex-col items-center justify-center transition",
        colorClass
      )}>
        <Icon className="text-2xl mb-2" size={24} />
        <span className="text-sm font-medium">{label}</span>
      </button>
    </Link>
  );
}

export function QuickActions() {
  const actions: QuickActionProps[] = [
    {
      icon: PlusCircle,
      label: "Novo Vídeo",
      href: "/create-video",
      colorClass: "bg-primary-50 hover:bg-primary-100 text-primary-700",
    },
    {
      icon: CalendarPlus,
      label: "Agendar",
      href: "/schedule",
      colorClass: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700",
    },
    {
      icon: TrendingUp,
      label: "Tendências",
      href: "/analytics",
      colorClass: "bg-orange-50 hover:bg-orange-100 text-orange-700",
    },
    {
      icon: Download,
      label: "Exportar",
      href: "/export",
      colorClass: "bg-blue-50 hover:bg-blue-100 text-blue-700",
    },
    {
      icon: Settings,
      label: "Configurar",
      href: "/settings",
      colorClass: "bg-gray-50 hover:bg-gray-100 text-gray-700",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-medium text-lg">Ações Rápidas</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-3 xs:grid-cols-2 sm:grid-cols-3 gap-3">
          {actions.map((action) => (
            <QuickAction key={action.href} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
}
