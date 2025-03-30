import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function UserAvatar() {
  const { toast } = useToast();
  
  // In a real application, you'd have proper authentication
  // For this demo, we'll use a dummy user
  const user = {
    id: 1,
    name: "Usuário Demo",
    email: "demo@example.com",
  };
  
  return (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white">
        <User size={16} />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{user.name}</p>
        <p className="text-xs text-gray-400">{user.email}</p>
      </div>
    </div>
  );
}
