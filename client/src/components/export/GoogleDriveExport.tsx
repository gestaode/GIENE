import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CloudUpload, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Configurações do OAuth do Google
const GOOGLE_CLIENT_ID = ''; // Pode ser configurado posteriormente pelo usuário
const GOOGLE_REDIRECT_URI = window.location.origin + '/auth/google/callback';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

interface GoogleDriveExportProps {
  onSuccess?: (driveLinkUrl: string) => void;
}

export function GoogleDriveExport({ onSuccess }: GoogleDriveExportProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'authenticating' | 'preparing' | 'uploading' | 'success' | 'error'>('idle');
  const [folderName, setFolderName] = useState('VideoGenie Exports');
  const [exportResult, setExportResult] = useState<{
    googleDriveId?: string;
    viewLink?: string;
    jobId?: string;
    error?: string;
  }>({});

  const initiateGoogleOAuth = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast({
        title: 'Configuração Incompleta',
        description: 'ID do cliente Google não configurado. Contate o administrador.',
        variant: 'destructive',
      });
      return;
    }

    setExportStatus('authenticating');

    // Construir URL de autenticação do Google
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=token&scope=${encodeURIComponent(GOOGLE_SCOPE)}`;

    // Abrir popup de autorização
    const authWindow = window.open(authUrl, 'google-oauth', 'width=600,height=600');

    // Monitorar eventos do popup
    const checkInterval = setInterval(() => {
      try {
        if (authWindow?.closed) {
          clearInterval(checkInterval);
          setExportStatus('idle');
          return;
        }

        // Verificar se o callback foi processado
        if (authWindow?.location.href.includes(GOOGLE_REDIRECT_URI)) {
          const url = new URL(authWindow.location.href);
          const hash = url.hash.substring(1); // Remover '#'
          const params = new URLSearchParams(hash);
          
          // Extrair token de acesso
          const accessToken = params.get('access_token');
          
          if (accessToken) {
            authWindow.close();
            clearInterval(checkInterval);
            
            // Iniciar exportação para o Google Drive
            startGoogleDriveExport(accessToken);
          } else {
            // Token não encontrado
            authWindow.close();
            clearInterval(checkInterval);
            setExportStatus('error');
            toast({
              title: 'Falha na Autenticação',
              description: 'Não foi possível obter autorização do Google Drive.',
              variant: 'destructive',
            });
          }
        }
      } catch (e) {
        // Erro de acesso entre origens - continuar tentando
      }
    }, 500);
  };

  const startGoogleDriveExport = async (accessToken: string) => {
    try {
      setExportStatus('preparing');
      setLoading(true);

      const response = await apiRequest('/api/google-export/export', {
        method: 'POST',
        body: {
          accessToken,
          folderName: folderName || 'VideoGenie Exports'
        },
      });

      if (response.success) {
        setExportStatus('success');
        setExportResult({
          googleDriveId: response.googleDriveId,
          viewLink: response.viewLink,
          jobId: response.jobId
        });

        toast({
          title: 'Exportação Concluída',
          description: 'Seu aplicativo foi exportado com sucesso para o Google Drive.',
        });

        if (onSuccess && response.viewLink) {
          onSuccess(response.viewLink);
        }
      } else {
        setExportStatus('error');
        setExportResult({
          error: response.error || 'Erro desconhecido ao exportar para o Google Drive.'
        });

        toast({
          title: 'Falha na Exportação',
          description: response.error || 'Erro desconhecido ao exportar para o Google Drive.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setExportStatus('error');
      setExportResult({
        error: error instanceof Error ? error.message : 'Erro ao exportar para o Google Drive'
      });

      toast({
        title: 'Falha na Exportação',
        description: error instanceof Error ? error.message : 'Erro ao exportar para o Google Drive',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (exportStatus) {
      case 'authenticating':
      case 'preparing':
      case 'uploading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <CloudUpload className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (exportStatus) {
      case 'authenticating':
        return 'Autenticando com o Google Drive...';
      case 'preparing':
        return 'Preparando arquivos para exportação...';
      case 'uploading':
        return 'Enviando para o Google Drive...';
      case 'success':
        return 'Exportação concluída com sucesso!';
      case 'error':
        return 'Falha na exportação.';
      default:
        return 'Pronto para exportar.';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudUpload className="h-5 w-5" />
          Exportar para Google Drive
        </CardTitle>
        <CardDescription>
          Exporte a aplicação diretamente para o seu Google Drive para armazenamento seguro.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="folderName">Nome da Pasta</Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              placeholder="Nome da pasta no Google Drive"
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-center py-6">
            {getStatusIcon()}
            <p className="ml-4 text-lg">{getStatusText()}</p>
          </div>

          {exportStatus === 'success' && (
            <div className="bg-green-50 p-4 rounded-md border border-green-200">
              <h3 className="font-semibold text-green-700">Exportação Concluída</h3>
              <p className="mt-1 text-green-600">O arquivo foi exportado com sucesso para o Google Drive.</p>
              {exportResult.viewLink && (
                <a 
                  href={exportResult.viewLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-blue-600 hover:underline"
                >
                  Abrir no Google Drive
                </a>
              )}
            </div>
          )}

          {exportStatus === 'error' && (
            <div className="bg-red-50 p-4 rounded-md border border-red-200">
              <h3 className="font-semibold text-red-700">Erro na Exportação</h3>
              <p className="mt-1 text-red-600">{exportResult.error || 'Ocorreu um erro durante a exportação.'}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={initiateGoogleOAuth} 
          disabled={loading || exportStatus === 'success'}
          className="flex gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <CloudUpload className="h-4 w-4" />
          Exportar para o Google Drive
        </Button>
      </CardFooter>
    </Card>
  );
}

export default GoogleDriveExport;