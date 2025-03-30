import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorInput } from './color-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formConfigSchema = z.object({
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres' }),
  description: z.string().optional(),
  fields: z.object({
    name: z.boolean(),
    email: z.boolean(),
    phone: z.boolean(),
    interest: z.boolean(),
  }),
  styles: z.object({
    backgroundColor: z.string(),
    textColor: z.string(),
    buttonColor: z.string(),
  }),
  isActive: z.boolean().default(true),
});

type FormConfigValues = z.infer<typeof formConfigSchema>;

export function LeadForm({ existingConfig = null }: { existingConfig?: any }) {
  const { toast } = useToast();
  const [formHtml, setFormHtml] = useState<string>('');
  
  const form = useForm<FormConfigValues>({
    resolver: zodResolver(formConfigSchema),
    defaultValues: existingConfig || {
      title: 'Receba dicas exclusivas de investimentos',
      description: 'Cadastre-se para receber conteúdos exclusivos sobre investimentos e finanças pessoais.',
      fields: {
        name: true,
        email: true,
        phone: false,
        interest: true,
      },
      styles: {
        backgroundColor: '#FFFFFF',
        textColor: '#111827',
        buttonColor: '#3B82F6',
      },
      isActive: true,
    },
  });
  
  const saveFormMutation = useMutation({
    mutationFn: async (data: FormConfigValues) => {
      const response = await apiRequest('POST', '/api/form-config', {
        ...data,
        userId: 1, // Demo user ID
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/form-config'] });
      toast({
        title: 'Formulário salvo com sucesso',
        description: 'As configurações do formulário foram salvas.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar formulário',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao salvar o formulário.',
        variant: 'destructive',
      });
    },
  });
  
  const generateCodeMutation = useMutation({
    mutationFn: async (data: FormConfigValues) => {
      // In a real application, we would call an API to generate the code
      // For this demo, we'll generate a simple HTML snippet
      const fields = [];
      
      if (data.fields.name) {
        fields.push(`
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1" style="color: ${data.styles.textColor}">Nome</label>
            <input type="text" name="name" class="w-full px-4 py-2 border rounded-lg" placeholder="Seu nome completo" style="border-color: rgba(0,0,0,0.1)">
          </div>
        `);
      }
      
      if (data.fields.email) {
        fields.push(`
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1" style="color: ${data.styles.textColor}">Email</label>
            <input type="email" name="email" class="w-full px-4 py-2 border rounded-lg" placeholder="Seu melhor email" style="border-color: rgba(0,0,0,0.1)">
          </div>
        `);
      }
      
      if (data.fields.phone) {
        fields.push(`
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1" style="color: ${data.styles.textColor}">Telefone</label>
            <input type="tel" name="phone" class="w-full px-4 py-2 border rounded-lg" placeholder="Seu telefone" style="border-color: rgba(0,0,0,0.1)">
          </div>
        `);
      }
      
      if (data.fields.interest) {
        fields.push(`
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1" style="color: ${data.styles.textColor}">Interesses</label>
            <select name="interest" class="w-full px-4 py-2 border rounded-lg" style="border-color: rgba(0,0,0,0.1)">
              <option value="">Selecione seu principal interesse</option>
              <option value="investimentos">Investimentos</option>
              <option value="economia">Economia</option>
              <option value="empreendedorismo">Empreendedorismo</option>
              <option value="financas">Finanças Pessoais</option>
            </select>
          </div>
        `);
      }
      
      const html = `
        <div style="max-width: 400px; margin: 0 auto; padding: 24px; border-radius: 8px; background-color: ${data.styles.backgroundColor}; color: ${data.styles.textColor}">
          <h2 style="text-align: center; font-size: 1.25rem; font-weight: 500; margin-bottom: 12px; color: ${data.styles.textColor}">${data.title}</h2>
          ${data.description ? `<p style="text-align: center; margin-bottom: 24px; color: ${data.styles.textColor}">${data.description}</p>` : ''}
          <form id="lead-capture-form" action="https://example.com/api/leads" method="POST">
            ${fields.join('')}
            <div class="mb-4">
              <label class="flex items-center">
                <input type="checkbox" name="consent" class="mr-2">
                <span class="text-sm" style="color: ${data.styles.textColor}">Concordo em receber emails com conteúdos e novidades</span>
              </label>
            </div>
            <button type="submit" style="width: 100%; padding: 12px; border-radius: 8px; background-color: ${data.styles.buttonColor}; color: white; font-weight: 500; border: none; cursor: pointer;">
              Quero receber conteúdos exclusivos
            </button>
          </form>
          <script>
            document.getElementById('lead-capture-form').addEventListener('submit', function(e) {
              e.preventDefault();
              const formData = new FormData(this);
              const data = {};
              formData.forEach((value, key) => data[key] = value);
              
              fetch('https://example.com/api/leads', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              })
              .then(response => response.json())
              .then(data => {
                alert('Obrigado por se cadastrar!');
                this.reset();
              })
              .catch(error => {
                console.error('Error:', error);
                alert('Ocorreu um erro ao enviar o formulário. Tente novamente mais tarde.');
              });
            });
          </script>
        </div>
      `;
      
      return html;
    },
    onSuccess: (html) => {
      setFormHtml(html);
      toast({
        title: 'Código gerado com sucesso',
        description: 'Copie o código HTML para usar em seu site.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao gerar código',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao gerar o código HTML.',
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: FormConfigValues) => {
    saveFormMutation.mutate(data);
  };
  
  const handleGenerateCode = () => {
    const values = form.getValues();
    generateCodeMutation.mutate(values);
  };
  
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título do Formulário</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Receba dicas de finanças" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva o que o usuário vai receber"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Campos do Formulário</h4>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="fields.name"
                render={({ field }) => (
                  <div className="flex items-center">
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="field-name"
                        />
                      </FormControl>
                      <FormLabel className="text-sm text-gray-700 cursor-pointer" htmlFor="field-name">
                        Nome
                      </FormLabel>
                    </FormItem>
                  </div>
                )}
              />
              
              <FormField
                control={form.control}
                name="fields.email"
                render={({ field }) => (
                  <div className="flex items-center">
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="field-email"
                        />
                      </FormControl>
                      <FormLabel className="text-sm text-gray-700 cursor-pointer" htmlFor="field-email">
                        Email
                      </FormLabel>
                    </FormItem>
                  </div>
                )}
              />
              
              <FormField
                control={form.control}
                name="fields.phone"
                render={({ field }) => (
                  <div className="flex items-center">
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="field-phone"
                        />
                      </FormControl>
                      <FormLabel className="text-sm text-gray-700 cursor-pointer" htmlFor="field-phone">
                        Telefone
                      </FormLabel>
                    </FormItem>
                  </div>
                )}
              />
              
              <FormField
                control={form.control}
                name="fields.interest"
                render={({ field }) => (
                  <div className="flex items-center">
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="field-interest"
                        />
                      </FormControl>
                      <FormLabel className="text-sm text-gray-700 cursor-pointer" htmlFor="field-interest">
                        Interesses
                      </FormLabel>
                    </FormItem>
                  </div>
                )}
              />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Cores</h4>
            <div className="flex space-x-4">
              <FormField
                control={form.control}
                name="styles.backgroundColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-xs text-gray-500 mb-1">Fundo</FormLabel>
                    <FormControl>
                      <ColorInput
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="styles.textColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-xs text-gray-500 mb-1">Texto</FormLabel>
                    <FormControl>
                      <ColorInput
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="styles.buttonColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-xs text-gray-500 mb-1">Botão</FormLabel>
                    <FormControl>
                      <ColorInput
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="flex space-x-4 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={saveFormMutation.isPending}
            >
              {saveFormMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Formulário'
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleGenerateCode}
              disabled={generateCodeMutation.isPending}
            >
              {generateCodeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                'Gerar Código'
              )}
            </Button>
          </div>
        </form>
      </Form>
      
      {formHtml && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Código HTML</h4>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <textarea
              className="w-full h-36 bg-gray-50 text-xs font-mono"
              value={formHtml}
              readOnly
              onClick={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.select();
                document.execCommand('copy');
                toast({
                  title: 'Código copiado',
                  description: 'O código HTML foi copiado para a área de transferência.',
                });
              }}
            />
            <p className="text-xs text-gray-500 mt-2">Clique no código para copiar para a área de transferência</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ColorInput já está importado de './color-input'
