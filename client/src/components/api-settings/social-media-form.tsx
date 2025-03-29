import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const socialMediaSchema = z.object({
  username: z.string().min(1, { message: "O username é obrigatório" }),
  apiKey: z.string().min(1, { message: "A chave de API é obrigatória" }),
});

type SocialMediaValues = z.infer<typeof socialMediaSchema>;

interface SocialMediaFormProps {
  platform: "tiktok" | "instagram";
  icon: React.ReactNode;
  className?: string;
}

export function SocialMediaForm({
  platform,
  icon,
  className,
}: SocialMediaFormProps) {
  const { toast } = useToast();
  
  const form = useForm<SocialMediaValues>({
    resolver: zodResolver(socialMediaSchema),
    defaultValues: {
      username: "",
      apiKey: "",
    },
  });
  
  const onSubmit = (data: SocialMediaValues) => {
    // In a real app, we would send this to the server
    console.log(`${platform} data:`, data);
    
    toast({
      title: "Conta conectada",
      description: `Sua conta do ${platform === "tiktok" ? "TikTok" : "Instagram"} foi conectada com sucesso.`,
    });
  };
  
  const getButtonClassName = () => {
    if (platform === "tiktok") {
      return "w-full bg-gray-800 hover:bg-black text-white";
    }
    
    if (platform === "instagram") {
      return "w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white";
    }
    
    return "w-full";
  };
  
  const getPlatformName = () => {
    return platform === "tiktok" ? "TikTok" : "Instagram";
  };
  
  return (
    <div className={cn("border border-gray-200 rounded-lg p-4", className)}>
      <div className="flex items-center space-x-3 mb-3">
        {icon}
        <h5 className="font-medium">{getPlatformName()}</h5>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-gray-600">Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder={`Seu username do ${getPlatformName()}`}
                    {...field}
                    className="w-full px-3 py-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-gray-600">API Key</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={`Insira sua chave API do ${getPlatformName()}`}
                    {...field}
                    className="w-full px-3 py-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit"
            className={getButtonClassName()}
          >
            <Link className="h-4 w-4 mr-2" />
            Conectar conta
          </Button>
        </form>
      </Form>
    </div>
  );
}
