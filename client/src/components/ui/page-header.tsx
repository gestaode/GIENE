import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UserCircle, Menu, X, Home, Settings, Video, Calendar, BarChart2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function PageHeader() {
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { label: "Dashboard", path: "/", icon: <Home size={18} /> },
    { label: "Criar Vídeo", path: "/create-video", icon: <Video size={18} /> },
    { label: "Agendamento", path: "/schedule", icon: <Calendar size={18} /> },
    { label: "Analytics", path: "/analytics", icon: <BarChart2 size={18} /> },
    { label: "Configurações", path: "/settings", icon: <Settings size={18} /> }
  ];

  const isCurrentPath = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setLocation("/")}
              className="flex-shrink-0 flex items-center"
            >
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VideoGenie
              </span>
            </button>
            
            <nav className="hidden md:ml-8 md:flex md:space-x-4">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`px-3 py-2 rounded-md text-sm font-medium inline-flex items-center ${
                    isCurrentPath(item.path)
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Button
                onClick={() => setLocation("/create-video")}
                className="hidden md:inline-flex mr-3"
              >
                <Video className="mr-2 h-4 w-4" />
                Novo Vídeo
              </Button>
              
              <Avatar className="cursor-pointer">
                <AvatarImage src="" />
                <AvatarFallback>
                  <UserCircle size={24} />
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="ml-4 md:hidden">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="py-4">
                    <div className="px-2 space-y-1">
                      {navigationItems.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => handleNavigation(item.path)}
                          className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                            isCurrentPath(item.path)
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="mr-3">{item.icon}</span>
                            {item.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}