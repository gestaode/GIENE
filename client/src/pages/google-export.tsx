import React from 'react';
import { useEffect } from 'react';
import GoogleDriveExport from '@/components/export/GoogleDriveExport';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { Link } from 'wouter';

export default function GoogleExportPage() {
  useEffect(() => {
    document.title = 'Exportar para Google Drive - VideoGenie';
  }, []);

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exportar para Google Drive</h1>
            <p className="text-muted-foreground mt-2">
              Exporte seu aplicativo completo diretamente para sua conta do Google Drive
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link to="/export" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Voltar para Exportação
              </Link>
            </Button>
            <Button asChild variant="default">
              <a href="/api/export/app" className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                Baixar ZIP
              </a>
            </Button>
          </div>
        </div>
        <Separator className="my-6" />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div>
          <GoogleDriveExport />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Instruções para exportação:</h2>
          <div className="bg-gray-50 p-6 rounded-md shadow-sm">
            <ol className="list-decimal list-inside space-y-4">
              <li>
                <span className="font-medium">Configurar credenciais do Google Drive:</span>
                <ul className="list-disc list-inside ml-5 mt-2 text-gray-700">
                  <li>Se você não vê a opção de autenticação, o ID do cliente Google ainda não está configurado.</li>
                  <li>Entre em contato com o administrador ou configure nas configurações do aplicativo.</li>
                </ul>
              </li>
              <li>
                <span className="font-medium">Autorizar o acesso:</span>
                <ul className="list-disc list-inside ml-5 mt-2 text-gray-700">
                  <li>Clique no botão "Exportar para o Google Drive".</li>
                  <li>Uma janela de autenticação do Google será aberta.</li>
                  <li>Faça login com sua conta Google e autorize o acesso.</li>
                </ul>
              </li>
              <li>
                <span className="font-medium">Aguarde a exportação:</span>
                <ul className="list-disc list-inside ml-5 mt-2 text-gray-700">
                  <li>O arquivo ZIP do aplicativo será criado e enviado ao seu Google Drive.</li>
                  <li>Não feche a janela até que o processo seja concluído.</li>
                </ul>
              </li>
              <li>
                <span className="font-medium">Acesse no Google Drive:</span>
                <ul className="list-disc list-inside ml-5 mt-2 text-gray-700">
                  <li>Após a conclusão, um link direto para o arquivo será fornecido.</li>
                  <li>O arquivo será armazenado na pasta especificada (ou na pasta "VideoGenie Exports" por padrão).</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}