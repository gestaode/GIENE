import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Search, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  interest?: string;
  createdAt: string;
}

export function LeadList() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: leads, isLoading, error } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });
  
  // Filter leads based on search query
  const filteredLeads = leads?.filter(lead => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lead.interest && lead.interest.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Get interest label color
  const getInterestColor = (interest?: string) => {
    switch(interest?.toLowerCase()) {
      case "investimentos":
        return "bg-primary-100 text-primary-700";
      case "economia":
        return "bg-emerald-100 text-emerald-700";
      case "empreendedorismo":
        return "bg-orange-100 text-orange-700";
      case "financas":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
      return "Data inválida";
    }
  };
  
  const handleExportCSV = () => {
    if (!leads || leads.length === 0) return;
    
    // Create CSV content
    const headers = ["Nome", "Email", "Telefone", "Interesse", "Data de Cadastro"];
    const rows = leads.map(lead => [
      lead.name,
      lead.email,
      lead.phone || "",
      lead.interest || "",
      formatDate(lead.createdAt)
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium">Carregando leads...</span>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col items-center justify-center py-6">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <h3 className="text-base font-medium text-gray-900 mb-1">Erro ao carregar leads</h3>
          <p className="text-sm text-gray-500">Não foi possível carregar a lista de leads.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium">Total: {leads?.length || 0} leads</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportCSV}
          disabled={!leads || leads.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>
      
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar leads por nome, email ou interesse..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {filteredLeads && filteredLeads.length > 0 ? (
          filteredLeads.map(lead => (
            <div 
              key={lead.id}
              className="bg-white p-3 rounded border border-gray-100 flex justify-between items-center hover:border-gray-200 transition"
            >
              <div>
                <p className="font-medium text-gray-800">{lead.name}</p>
                <p className="text-sm text-gray-500">{lead.email}</p>
                {lead.phone && <p className="text-xs text-gray-400">{lead.phone}</p>}
              </div>
              <div className="flex items-center space-x-2">
                {lead.interest && (
                  <span className={`text-xs px-2 py-1 rounded ${getInterestColor(lead.interest)}`}>
                    {lead.interest}
                  </span>
                )}
                <span className="text-xs text-gray-400">{formatDate(lead.createdAt)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchQuery
                ? "Nenhum lead encontrado para esta busca."
                : "Nenhum lead capturado ainda."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
