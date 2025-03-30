import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface Lead {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone?: string;
  interest?: string;
  createdAt: string;
}

export interface FormConfig {
  id: number;
  userId: number;
  title: string;
  description?: string;
  fields: {
    name: boolean;
    email: boolean;
    phone: boolean;
    interest: boolean;
  };
  styles: {
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
  };
  isActive: boolean;
}

export function useLeads() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get leads
  const {
    data: leads,
    isLoading: isLoadingLeads,
    error: leadsError,
  } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  // Get form configuration
  const {
    data: formConfig,
    isLoading: isLoadingFormConfig,
    error: formConfigError,
  } = useQuery<FormConfig>({
    queryKey: ["/api/form-config"],
  });

  // Create a new lead
  const createLeadMutation = useMutation({
    mutationFn: async (leadData: Omit<Lead, "id" | "userId" | "createdAt">) => {
      const response = await apiRequest("POST", "/api/leads", {
        ...leadData,
        userId: 1, // Demo user ID
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead criado com sucesso",
        description: "O lead foi adicionado à sua lista.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar lead",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar o lead.",
        variant: "destructive",
      });
    },
  });

  // Save form configuration
  const saveFormConfigMutation = useMutation({
    mutationFn: async (configData: Omit<FormConfig, "id" | "userId">) => {
      const response = await apiRequest("POST", "/api/form-config", {
        ...configData,
        userId: 1, // Demo user ID
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/form-config"] });
      toast({
        title: "Configuração salva",
        description: "A configuração do formulário foi salva com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar configuração",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar a configuração do formulário.",
        variant: "destructive",
      });
    },
  });

  // Export leads to CSV
  const exportLeadsToCSV = () => {
    if (!leads || leads.length === 0) {
      toast({
        title: "Nenhum lead para exportar",
        description: "Você não possui leads para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV header
    const headers = ["ID", "Nome", "Email", "Telefone", "Interesse", "Data de Cadastro"];
    
    // Map lead data to CSV rows
    const rows = leads.map(lead => [
      lead.id,
      lead.name,
      lead.email,
      lead.phone || "",
      lead.interest || "",
      lead.createdAt
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];
    
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Exportação concluída",
      description: `${leads.length} leads foram exportados para CSV.`,
    });
  };

  return {
    leads,
    isLoadingLeads,
    leadsError,
    formConfig,
    isLoadingFormConfig,
    formConfigError,
    createLead: createLeadMutation.mutate,
    isCreatingLead: createLeadMutation.isPending,
    saveFormConfig: saveFormConfigMutation.mutate,
    isSavingFormConfig: saveFormConfigMutation.isPending,
    exportLeadsToCSV,
  };
}
