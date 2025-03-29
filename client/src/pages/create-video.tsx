import { CreationWizard } from "@/components/video-creation/creation-wizard";

function PageHeader() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <h2 className="font-bold text-xl text-gray-800">Criar Vídeo</h2>
      </div>
    </header>
  );
}

export default function CreateVideo() {
  return (
    <>
      <PageHeader />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-medium text-lg">Assistente de Criação de Vídeo</h3>
          </div>
          <div className="p-6">
            <CreationWizard />
          </div>
        </div>
      </div>
    </>
  );
}
