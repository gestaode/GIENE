import { useState } from "react";
import { LeadForm } from "@/components/leads/lead-form";
import { LeadList } from "@/components/leads/lead-list";
import { useLeads } from "@/hooks/use-leads";
import { UserPlus, Loader2 } from "lucide-react";

function PageHeader() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <h2 className="font-bold text-xl text-gray-800">Leads</h2>
      </div>
    </header>
  );
}

export default function Leads() {
  const { formConfig, isLoadingFormConfig } = useLeads();
  const [previewActive, setPreviewActive] = useState(false);
  
  const handleTogglePreview = () => {
    setPreviewActive(!previewActive);
  };
  
  return (
    <>
      <PageHeader />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-medium text-lg">Formulário de Captura de Leads</h3>
              </div>
              <div className="p-6">
                {isLoadingFormConfig ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : (
                  <LeadForm existingConfig={formConfig} />
                )}
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-medium text-lg">Prévia do Formulário</h3>
              </div>
              <div className="p-6">
                {isLoadingFormConfig ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : formConfig ? (
                  <div 
                    className="border border-gray-200 rounded-lg p-6 shadow-sm"
                    style={{
                      backgroundColor: formConfig.styles.backgroundColor,
                      color: formConfig.styles.textColor,
                    }}
                  >
                    <h5 
                      className="text-xl font-medium text-center mb-3"
                      style={{ color: formConfig.styles.textColor }}
                    >
                      {formConfig.title}
                    </h5>
                    
                    {formConfig.description && (
                      <p 
                        className="text-center mb-6"
                        style={{ color: formConfig.styles.textColor }}
                      >
                        {formConfig.description}
                      </p>
                    )}
                    
                    <form className="space-y-4">
                      {formConfig.fields.name && (
                        <div>
                          <label 
                            className="block text-sm font-medium mb-1"
                            style={{ color: formConfig.styles.textColor }}
                          >
                            Nome
                          </label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-2 border rounded-lg" 
                            placeholder="Seu nome completo"
                            style={{ borderColor: "rgba(0,0,0,0.1)" }}
                          />
                        </div>
                      )}
                      
                      {formConfig.fields.email && (
                        <div>
                          <label 
                            className="block text-sm font-medium mb-1"
                            style={{ color: formConfig.styles.textColor }}
                          >
                            Email
                          </label>
                          <input 
                            type="email" 
                            className="w-full px-4 py-2 border rounded-lg" 
                            placeholder="Seu melhor email"
                            style={{ borderColor: "rgba(0,0,0,0.1)" }}
                          />
                        </div>
                      )}
                      
                      {formConfig.fields.phone && (
                        <div>
                          <label 
                            className="block text-sm font-medium mb-1"
                            style={{ color: formConfig.styles.textColor }}
                          >
                            Telefone
                          </label>
                          <input 
                            type="tel" 
                            className="w-full px-4 py-2 border rounded-lg" 
                            placeholder="Seu telefone"
                            style={{ borderColor: "rgba(0,0,0,0.1)" }}
                          />
                        </div>
                      )}
                      
                      {formConfig.fields.interest && (
                        <div>
                          <label 
                            className="block text-sm font-medium mb-1"
                            style={{ color: formConfig.styles.textColor }}
                          >
                            Interesses
                          </label>
                          <select 
                            className="w-full px-4 py-2 border rounded-lg"
                            style={{ borderColor: "rgba(0,0,0,0.1)" }}
                          >
                            <option value="">Selecione seu principal interesse</option>
                            <option value="investimentos">Investimentos</option>
                            <option value="economia">Economia</option>
                            <option value="empreendedorismo">Empreendedorismo</option>
                            <option value="financas">Finanças Pessoais</option>
                          </select>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <input type="checkbox" id="terms" className="mr-2" />
                        <label 
                          htmlFor="terms" 
                          className="text-sm"
                          style={{ color: formConfig.styles.textColor }}
                        >
                          Concordo em receber emails com conteúdos e novidades
                        </label>
                      </div>
                      
                      <button 
                        type="button" 
                        className="w-full py-3 px-4 rounded-lg font-medium transition"
                        style={{ 
                          backgroundColor: formConfig.styles.buttonColor,
                          color: "white"
                        }}
                      >
                        Quero receber conteúdos exclusivos
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum formulário configurado</h4>
                    <p className="text-gray-500">
                      Configure o formulário ao lado para ver a prévia aqui.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-medium text-lg">Leads Capturados</h3>
              </div>
              <div className="p-6">
                <LeadList />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
