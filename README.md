# VideoGenie - Plataforma de Automação de Conteúdo em Vídeo

## Sobre o Projeto

VideoGenie é uma plataforma avançada de automação para criação e distribuição de conteúdo em vídeo para redes sociais. O sistema utiliza inteligência artificial para gerar roteiros, criar conteúdo visual, sintetizar áudio e distribuir automaticamente para múltiplas plataformas de mídia social.

## Arquitetura Modular

O projeto segue uma arquitetura modular, dividida em componentes independentes:

### Módulos Principais

1. **Módulo de Geração de Conteúdo**: Responsável por criar roteiros, textos e conteúdo com IA
2. **Módulo de Processamento de Dados**: Análise de métricas, dados financeiros e relatórios
3. **Módulo de Automação de Vendas**: Gestão de leads, funis de venda e campanhas de email
4. **Módulo de Integração com Redes Sociais**: Publicação e monitoramento nas plataformas sociais
5. **Módulo de Dashboard**: Visualização de métricas e controle centralizado
6. **Módulo de Resiliência**: Testes automáticos e mecanismos de fallback
7. **Módulo de Exportação**: Exportação de código e dados para backups

## Características do Sistema

- **Sistema de Resiliência**: Mecanismos de fallback quando APIs externas falham
- **Integrações Múltiplas de IA**: OpenAI, Gemini, Mistral AI, HuggingFace
- **Cache Inteligente**: Redução de custos e melhoria de desempenho
- **Processamento de Áudio e Vídeo**: FFmpeg para manipulação avançada de mídia
- **Automação Multi-Plataforma**: Suporte para múltiplas redes sociais

## Integração com GitHub e ChatGPT

O projeto utiliza uma integração avançada com GitHub e ChatGPT para melhorar o fluxo de trabalho:

1. **GitHub**: Versionamento do código e colaboração
2. **Replit**: Ambiente de desenvolvimento e execução
3. **ChatGPT**: Assistência na programação e sugestões de otimização

## Tecnologias Utilizadas

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Node.js, Express
- **Processamento de Mídia**: FFmpeg
- **IA e Geração de Conteúdo**: OpenAI, Gemini, Mistral, HuggingFace
- **Armazenamento**: Cache local, JSON, potencial para bancos de dados

## Começando

### Pré-requisitos

- Node.js 18+
- FFmpeg instalado no sistema
- Chaves de API para serviços de IA (opcional, sistema funciona com fallbacks)

### Instalação

1. Clone o repositório:
   ```
   git clone https://github.com/seu-usuario/videogenie.git
   cd videogenie
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```
   cp .env.example .env
   ```
   Edite o arquivo .env com suas chaves de API

4. Inicie o servidor de desenvolvimento:
   ```
   npm run dev
   ```

### Estrutura de Diretórios

```
.
├── client/            # Frontend React
├── server/            # Backend Node.js
│   ├── modules/       # Módulos do sistema
│   │   ├── content-generation/
│   │   ├── data-processing/
│   │   ├── resilience/
│   │   ├── social-media/
│   │   └── ...
│   ├── services/      # Serviços compartilhados
│   └── index.ts       # Ponto de entrada do servidor
├── shared/            # Código compartilhado entre cliente e servidor
├── fallback-cache/    # Cache local para sistema de resiliência
└── uploads/           # Pasta para uploads temporários
```

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nome-da-feature`)
3. Faça commit das alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nome-da-feature`)
5. Abra um Pull Request

## Roadmap

- Implementar interface de administração mais avançada
- Adicionar suporte para mais plataformas de mídia social
- Expandir os mecanismos de fallback
- Implementar testes automatizados mais abrangentes
- Adicionar suporte para mais idiomas

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para mais detalhes.