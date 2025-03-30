import React from "react";
import { ImageGeneratorTest } from "@/components/test/image-generator-test";

export default function ImageTesterPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gerador de Imagens de Teste</h1>
        <p className="text-gray-600 mt-2">
          Esta ferramenta permite gerar imagens de teste localmente para utilizar nos vídeos, 
          eliminando a dependência de APIs externas quando necessário.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <ImageGeneratorTest />
      </div>
    </div>
  );
}