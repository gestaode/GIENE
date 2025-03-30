import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./user-avatar";
import {
  LayoutDashboard,
  PlusCircle,
  LibraryBig,
  Calendar,
  UserPlus,
  BarChart2,
  Settings,
  Menu,
  X,
  Video,
  TestTube,
  Image as ImageIcon,
  Download
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function Sidebar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      href: "/",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      href: "/create-video",
      label: "Criar Vídeo",
      icon: <PlusCircle size={20} />,
    },
    {
      href: "/library",
      label: "Biblioteca",
      icon: <LibraryBig size={20} />,
    },
    {
      href: "/schedule",
      label: "Agendamento",
      icon: <Calendar size={20} />,
    },
    {
      href: "/leads",
      label: "Leads",
      icon: <UserPlus size={20} />,
    },
    {
      href: "/analytics",
      label: "Analytics",
      icon: <BarChart2 size={20} />,
    },
    {
      href: "/export",
      label: "Exportar",
      icon: <Download size={20} />,
    },
    {
      href: "/settings",
      label: "Configurações",
      icon: <Settings size={20} />,
    },
    {
      href: "/test-advanced-video",
      label: "Teste de Vídeo",
      icon: <TestTube size={20} />,
    },
    {
      href: "/image-tester",
      label: "Gerador de Imagens",
      icon: <ImageIcon size={20} />,
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed bottom-4 right-4 bg-primary-600 text-white p-3 rounded-full shadow-lg z-50"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "bg-gray-900 text-white w-full md:w-64 md:fixed md:h-full flex-shrink-0",
        isMobileMenuOpen ? "fixed inset-0 z-40" : "hidden md:block"
      )}>
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-8">
            <Video className="text-primary-500 text-2xl" />
            <h1 className="text-xl font-bold">VideoGenie</h1>
          </div>

          <nav>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center space-x-2 p-3 rounded-lg cursor-pointer",
                        location === item.href
                          ? "bg-gray-800 text-white"
                          : "hover:bg-gray-800 text-gray-300"
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-800">
          <UserAvatar />
        </div>
      </aside>
    </>
  );
}