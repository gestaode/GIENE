import React from 'react';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { CloudUpload, Download, FileBox, Github } from 'lucide-react';

export default function ExportPage() {
  useEffect(() => {
    document.title = 'Exportar - VideoGenie';
  }, []);

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exportar VideoGenie</h1>
        <p className="text-muted-foreground mt-2">
          Escolha uma opção para exportar o aplicativo completo ou apenas dados específicos
        </p>
        <Separator className="my-6" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ExportCard 
          title="Download Direto" 
          description="Faça o download do aplicativo completo como um arquivo ZIP"
          icon={<Download className="h-10 w-10 text-blue-500" />}
          linkText="Baixar ZIP"
          linkUrl="/api/export/app"
          isExternalLink
        />

        <ExportCard 
          title="Google Drive" 
          description="Exporte diretamente para sua conta do Google Drive"
          icon={<CloudUpload className="h-10 w-10 text-green-500" />}
          linkText="Exportar para Drive"
          linkUrl="/google-export"
        />

        <ExportCard 
          title="Exportar Vídeos" 
          description="Faça o download apenas dos vídeos gerados pela aplicação"
          icon={<FileBox className="h-10 w-10 text-violet-500" />}
          linkText="Exportar Vídeos"
          linkUrl="/api/export/start"
          postParams={{
            type: 'videos',
            format: 'zip'
          }}
        />

        <ExportCard 
          title="Exportar Dados" 
          description="Exporte seus dados em formato JSON para usar em outro sistema"
          icon={<FileBox className="h-10 w-10 text-amber-500" />}
          linkText="Exportar Dados"
          linkUrl="/api/export/start"
          postParams={{
            type: 'data',
            format: 'json'
          }}
        />

        <ExportCard 
          title="Exportar Código" 
          description="Exporte apenas o código-fonte sem arquivos de dados"
          icon={<Github className="h-10 w-10 text-gray-800" />}
          linkText="Exportar Código"
          linkUrl="/api/export/start"
          postParams={{
            type: 'code',
            format: 'zip'
          }}
        />
      </div>

      <div className="mt-12 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Instruções para Exportação</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-2">Exportação Completa</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>O <strong>Download Direto</strong> permite baixar todo o aplicativo como um arquivo ZIP.</li>
              <li>A exportação para o <strong>Google Drive</strong> envia o mesmo arquivo ZIP diretamente para sua conta Google.</li>
              <li>Ambas as opções incluem código-fonte, configurações e amostras de dados.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Exportação Parcial</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li><strong>Vídeos</strong>: Apenas os vídeos gerados pelo aplicativo.</li>
              <li><strong>Dados</strong>: Registros do banco de dados em formato JSON.</li>
              <li><strong>Código</strong>: Apenas os arquivos de código-fonte sem dados de usuário.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ExportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkText: string;
  linkUrl: string;
  isExternalLink?: boolean;
  postParams?: Record<string, any>;
}

function ExportCard({ title, description, icon, linkText, linkUrl, isExternalLink, postParams }: ExportCardProps) {
  const [loading, setLoading] = React.useState(false);

  const handlePostRequest = async () => {
    if (!postParams) return;
    
    try {
      setLoading(true);
      const response = await fetch(linkUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postParams),
      });
      
      if (!response.ok) {
        throw new Error(`Erro na resposta: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.downloadUrl) {
        window.location.href = data.downloadUrl;
      } else if (data.jobId) {
        // Se temos um jobId mas não temos downloadUrl, redirecionar para o endpoint de download
        window.location.href = `/api/export/download/${data.jobId}`;
      } else if (data.success) {
        // Caso de sucesso sem URL específica
        alert('Exportação concluída com sucesso!');
      } else {
        throw new Error(data.error || 'Erro desconhecido na exportação');
      }
    } catch (error) {
      console.error('Erro ao solicitar exportação:', error);
      alert(`Erro na exportação: ${error instanceof Error ? error.message : 'Falha na conexão'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="mb-4 flex justify-center">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Conteúdo adicional pode ir aqui */}
      </CardContent>
      <CardFooter>
        {isExternalLink ? (
          <Button asChild className="w-full">
            <a href={linkUrl} target="_blank" rel="noopener noreferrer">
              {linkText}
            </a>
          </Button>
        ) : postParams ? (
          <Button 
            className="w-full" 
            onClick={handlePostRequest}
            disabled={loading}
          >
            {loading ? 'Processando...' : linkText}
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link to={linkUrl}>{linkText}</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}