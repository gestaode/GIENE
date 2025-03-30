# VideoGenie - Documentação

Bem-vindo à documentação do VideoGenie, uma plataforma completa de criação e automação de conteúdo para redes sociais com inteligência artificial.

## Visão Geral

O VideoGenie é um sistema que permite automatizar a criação de vídeos curtos para TikTok e Instagram com integração avançada de IA. O sistema lida com criação de conteúdo, produção de vídeos, publicação em redes sociais, detecção de tendências e marketing por email em um funil de vendas completo.

## Índice da Documentação

- [Sistema de Testes e Atualizações](sistema-testes-atualizacoes.md)
- [APIs e Integrações](apis-integracoes.md) (A ser adicionado)
- [Ambiente de Desenvolvimento](ambiente-desenvolvimento.md) (A ser adicionado)
- [Guia do Usuário](guia-usuario.md) (A ser adicionado)
- [Referência da API](referencia-api.md) (A ser adicionado)
- [Arquitetura do Sistema](arquitetura-sistema.md) (A ser adicionado)

## Características Principais

- **Arquitetura Modular**: Sistema baseado em microserviços autônomos
- **Multi-IA**: Integração com múltiplas APIs de IA (OpenAI, HuggingFace, Mistral)
- **Fallbacks Robustos**: Sistema continua funcionando mesmo com falhas parciais
- **Teste Automatizado**: Sistema extensivo de testes com correção automática de erros
- **Geração Completa**: Criação de scripts, vídeos e estratégias de redes sociais
- **Português Nativo**: Otimizado para vozes naturais em português brasileiro

## Requisitos do Sistema

- Node.js 18 ou superior
- Python 3.11 ou superior
- FFmpeg para processamento de vídeo
- APIs configuradas:
  - Pelo menos uma API de geração de texto (OpenAI, Mistral, HuggingFace)
  - Pelo menos uma API de imagens (Pexels, etc.)
  - Pelo menos uma API de text-to-speech (Google TTS, HuggingFace TTS)

## Começando

Para começar a usar o VideoGenie:

1. Certifique-se de ter todas as dependências instaladas
2. Configure suas chaves de API nas configurações do sistema
3. Inicie o servidor com `npm run dev`
4. Acesse a interface web em `http://localhost:3000`

## Contribuindo

Contribuições são bem-vindas! Por favor, leia o [guia de contribuição](contribuindo.md) (A ser adicionado) para mais detalhes sobre como contribuir para o projeto.

## Licença

Este projeto é licenciado sob os termos da licença proprietária VideoGenie. Todos os direitos reservados.