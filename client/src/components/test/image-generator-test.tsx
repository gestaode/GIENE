import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

export function ImageGeneratorTest() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [text, setText] = useState("Marketing Digital");
  const [bgColor, setBgColor] = useState("#3498db");
  const [textColor, setTextColor] = useState("#ffffff");
  const [imageCount, setImageCount] = useState<string>("3");

  const generateTestImages = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/test-images/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          count: parseInt(imageCount),
          text,
          bgColor,
          textColor
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro na geração de imagens: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.imagePaths) {
        setGeneratedImages(data.imagePaths);
        toast({
          title: "Imagens geradas com sucesso",
          description: `${data.imagePaths.length} imagens foram geradas`,
          variant: "default"
        });
      } else {
        throw new Error(data.error || "Erro desconhecido na geração de imagens");
      }
    } catch (error) {
      console.error("Erro ao gerar imagens:", error);
      toast({
        title: "Erro ao gerar imagens",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Teste de Geração de Imagens</CardTitle>
        <CardDescription>
          Gere imagens coloridas para testar a funcionalidade de imagens de fallback
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="text">Texto da Imagem</Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Texto a ser exibido na imagem"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageCount">Quantidade</Label>
            <Select value={imageCount} onValueChange={setImageCount}>
              <SelectTrigger id="imageCount">
                <SelectValue placeholder="Selecione a quantidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 imagem</SelectItem>
                <SelectItem value="3">3 imagens</SelectItem>
                <SelectItem value="5">5 imagens</SelectItem>
                <SelectItem value="10">10 imagens</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bgColor">Cor de Fundo</Label>
            <div className="flex space-x-2">
              <Input
                id="bgColor"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                placeholder="#RRGGBB"
              />
              <input 
                type="color" 
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-10 w-10 cursor-pointer"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="textColor">Cor do Texto</Label>
            <div className="flex space-x-2">
              <Input
                id="textColor"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                placeholder="#RRGGBB"
              />
              <input 
                type="color" 
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-10 w-10 cursor-pointer"
              />
            </div>
          </div>
        </div>
        
        <Button 
          onClick={generateTestImages}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? <Spinner className="mr-2" /> : null}
          {isGenerating ? "Gerando imagens..." : "Gerar Imagens de Teste"}
        </Button>
        
        {generatedImages.length > 0 && (
          <div className="space-y-4 mt-4">
            <h3 className="font-medium text-lg">Imagens Geradas:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedImages.map((imagePath, index) => (
                <Card key={index} className="overflow-hidden">
                  <img 
                    src={imagePath} 
                    alt={`Imagem gerada ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />
                  <CardFooter className="text-xs text-gray-500 p-2 break-all">
                    {imagePath}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}