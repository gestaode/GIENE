/**
 * Gerador de scripts de vídeo local que não depende de APIs externas
 * 
 * Este módulo fornece funcionalidade para gerar scripts de vídeo
 * sem depender de APIs externas, servindo como fallback quando as conexões falham.
 */

import { log } from '../../../vite';
import { nanoid } from 'nanoid';

interface ScriptGenerationOptions {
  duração?: number; // duração em segundos
  tom?: 'profissional' | 'casual' | 'humorístico' | 'dramático';
  formato?: 'tutorial' | 'explicativo' | 'lista' | 'storytelling';
  idioma?: 'pt-BR' | 'en-US';
  incluirChamadaAção?: boolean;
}

interface ScriptGenerationResult {
  script: string;
  title: string;
  sections: string[];
  estimatedDuration: number;
  model: string;
  requestId: string;
}

// Templates de script por formato
const scriptTemplates = {
  tutorial: {
    intro: [
      'Olá a todos! Neste vídeo, eu vou mostrar como {tema}.',
      'Bem-vindos ao tutorial sobre {tema}. Vamos lá!',
      'Você já quis aprender sobre {tema}? Hoje eu vou te ensinar como!',
      'Olá! Se você quer dominar {tema}, este vídeo é para você.',
      'E aí, pessoal! Vamos aprender juntos como {tema}?',
    ],
    steps: [
      'Primeiro, você precisa {ação1}.',
      'O próximo passo é {ação2}.',
      'Agora, vamos {ação3}.',
      'Em seguida, é hora de {ação4}.',
      'O quarto passo é {ação5}.',
      'Por último, você deve {ação6}.',
    ],
    tips: [
      'Uma dica importante: sempre {dica1}.',
      'Não esqueça de {dica2}.',
      'Para melhores resultados, tente {dica3}.',
      'Um erro comum é {erro_comum}. Evite isso!',
      'Lembre-se de {lembrança}.',
    ],
    conclusion: [
      'E é isso! Agora você sabe como {tema}.',
      'Pronto! Você acaba de aprender como {tema}.',
      'Foi fácil, não foi? Agora você pode {tema} sem problemas.',
      'Espero que esse tutorial tenha sido útil para você aprender sobre {tema}.',
      'E assim concluímos este tutorial sobre {tema}.',
    ],
  },
  explicativo: {
    intro: [
      'Você já se perguntou sobre {tema}? Neste vídeo, vou explicar tudo!',
      'Olá! Hoje vamos entender profundamente o que é {tema}.',
      'O que exatamente é {tema}? Vamos desvendar isso juntos neste vídeo.',
      'Bem-vindos! Vamos explorar o fascinante mundo de {tema}.',
      '{tema} é um assunto que gera muitas dúvidas. Vamos esclarecê-las!',
    ],
    concepts: [
      'Para entender {tema}, precisamos primeiro compreender que {conceito1}.',
      'Um ponto fundamental é que {conceito2}.',
      'Muitas pessoas não sabem, mas {conceito3}.',
      'É importante destacar que {conceito4}.',
      'Um princípio básico de {tema} é {conceito5}.',
    ],
    examples: [
      'Por exemplo, quando {exemplo1}.',
      'Podemos ver isso na prática quando {exemplo2}.',
      'Um caso real disso é {exemplo3}.',
      'Imagine a seguinte situação: {exemplo4}.',
      'Para ilustrar melhor, vamos pensar em {exemplo5}.',
    ],
    conclusion: [
      'Agora que você entende {tema}, pode aplicar este conhecimento no seu dia a dia.',
      'Com essas informações, você já sabe muito mais sobre {tema} do que a maioria das pessoas.',
      'Espero que essa explicação tenha esclarecido suas dúvidas sobre {tema}.',
      'Compreender {tema} pode transformar a maneira como você vê o mundo.',
      'E assim concluímos nossa explicação sobre {tema}.',
    ],
  },
  lista: {
    intro: [
      'Olá! Hoje vou apresentar os top {número} {tema} que você precisa conhecer.',
      'Bem-vindos! Neste vídeo, vou mostrar {número} maneiras de {tema}.',
      'Quer saber as {número} melhores dicas sobre {tema}? Assista até o final!',
      'Olá a todos! Separei as {número} estratégias essenciais para {tema}.',
      'E aí, pessoal! Vamos conhecer os {número} segredos para {tema}?',
    ],
    items: [
      'Número {n}: {item}. Isso é crucial porque {razão}.',
      'Em {n}º lugar temos: {item}. Por que isso funciona? {razão}.',
      'O {n}º item da nossa lista é {item}. O interessante aqui é que {razão}.',
      'Número {n}: {item}. Muitas pessoas ignoram isso, mas {razão}.',
      '{n}. {item}. Este é especial porque {razão}.',
    ],
    conclusion: [
      'E aí está! Os {número} melhores {tema} para você aplicar hoje mesmo.',
      'Agora você conhece as {número} estratégias essenciais sobre {tema}.',
      'Espero que esta lista de {número} dicas sobre {tema} seja útil para você.',
      'Estas foram as {número} maneiras de dominar {tema}. Qual foi sua favorita?',
      'E estes foram os {número} segredos para {tema}. Não se esqueça de experimentá-los!',
    ],
  },
  storytelling: {
    intro: [
      'Você já imaginou o que aconteceria se {situação_hipotética}? Essa é a história de {personagem}.',
      'Hoje vou contar uma história fascinante sobre {tema}. Tudo começou quando {início}.',
      'A jornada de {personagem} com {tema} começou de forma inusitada. Deixe-me contar como...',
      'Olá! Prepare-se para uma história incrível sobre {tema} que mudou a vida de {personagem}.',
      'Era uma vez {personagem}, que enfrentou um grande desafio com {tema}.',
    ],
    development: [
      'No início, {personagem} pensava que {crença_inicial}. Mas logo descobriu que {realidade}.',
      'O primeiro obstáculo surgiu quando {obstáculo}. Foi necessário muito {qualidade} para superá-lo.',
      'A situação complicou-se quando {complicação}. Ninguém esperava que {reviravolta}.',
      'Em um momento crucial, {personagem} percebeu que {descoberta}. Isso mudou tudo!',
      'Através de muito esforço, {personagem} aprendeu que {lição}.',
    ],
    climax: [
      'O momento decisivo chegou quando {clímax}. Era agora ou nunca!',
      'Tudo mudou no instante em que {momento_chave}. Foi uma verdadeira transformação.',
      'A grande revelação veio: {revelação}. Nada seria como antes.',
      'Na hora mais difícil, {personagem} tomou uma decisão corajosa: {decisão}.',
      'O ponto de virada aconteceu quando {virada}. As consequências foram surpreendentes.',
    ],
    conclusion: [
      'Hoje, {personagem} pode dizer que {tema} transformou completamente sua vida.',
      'E assim, {personagem} aprendeu uma valiosa lição sobre {tema} que leva até hoje.',
      'Esta história nos ensina que, quando se trata de {tema}, o mais importante é {lição_moral}.',
      'A jornada de {personagem} com {tema} nos mostra que nunca devemos desistir dos nossos sonhos.',
      'No final, percebemos que {tema} não é apenas sobre técnicas, mas sobre transformação pessoal.',
    ],
  },
};

// Chamadas à ação por tipo de conteúdo
const callsToAction = {
  genérico: [
    'Se você gostou deste vídeo, não esqueça de deixar o seu like e se inscrever no canal!',
    'Para mais conteúdo como este, inscreva-se no canal e ative o sininho de notificações!',
    'Deixe nos comentários o que você achou e quais outros temas gostaria de ver aqui!',
    'Compartilhe este vídeo com alguém que também se beneficiaria dessas informações!',
    'Não perca os próximos vídeos! Inscreva-se agora mesmo e ative as notificações!',
  ],
  educacional: [
    'Para aprofundar seu conhecimento sobre este tema, baixe o material complementar no link abaixo!',
    'Temos um curso completo sobre este assunto. Confira o link na descrição do vídeo!',
    'Se você tem dúvidas sobre o tema, deixe nos comentários que responderei pessoalmente!',
    'Para exemplos práticos adicionais, acesse nosso blog através do link na descrição!',
    'Inscreva-se no canal para continuar sua jornada de aprendizado com nossos conteúdos semanais!',
  ],
  negócios: [
    'Para implementar esta estratégia em seu negócio, agende uma consultoria gratuita no link abaixo!',
    'Baixe nosso e-book gratuito com 10 dicas adicionais sobre este tema!',
    'Junte-se à nossa comunidade de empreendedores para trocar experiências e crescer juntos!',
    'Para um diagnóstico personalizado do seu negócio, clique no link na descrição!',
    'Siga-nos nas redes sociais para dicas diárias sobre como impulsionar seu empreendimento!',
  ],
  pessoal: [
    'Se você quer transformar sua vida assim como {personagem}, comece hoje mesmo com nosso plano de ação!',
    'Compartilhe sua própria experiência nos comentários! Adoraria saber sua história!',
    'Para um acompanhamento personalizado, conheça nosso programa de mentoria!',
    'Junte-se ao nosso grupo de apoio, onde pessoas com os mesmos objetivos se ajudam mutuamente!',
    'Baixe nosso aplicativo para acompanhar seu progresso diário nesta jornada de transformação!',
  ],
};

// Temas populares e suas palavras-chave associadas
const popularThemes = {
  'finanças pessoais': [
    'controle de gastos',
    'investimentos',
    'reserva de emergência',
    'independência financeira',
    'orçamento doméstico',
    'dívidas',
    'aposentadoria',
  ],
  'marketing digital': [
    'redes sociais',
    'SEO',
    'conteúdo',
    'tráfego pago',
    'e-mail marketing',
    'conversão',
    'marca pessoal',
  ],
  'desenvolvimento pessoal': [
    'produtividade',
    'hábitos',
    'liderança',
    'comunicação',
    'motivação',
    'resiliência',
    'autoconhecimento',
  ],
  'saúde e bem-estar': [
    'exercícios',
    'nutrição',
    'sono',
    'meditação',
    'estresse',
    'equilíbrio emocional',
    'prevenção',
  ],
  'tecnologia': [
    'inteligência artificial',
    'programação',
    'aplicativos',
    'segurança digital',
    'blockchain',
    'automação',
    'IoT',
  ],
  'educação': [
    'técnicas de estudo',
    'aprendizado rápido',
    'memorização',
    'cursos online',
    'formação continuada',
    'educação infantil',
    'carreira acadêmica',
  ],
};

/**
 * Seleciona aleatoriamente um elemento de um array
 */
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Substitui placeholders em um template
 */
function replacePlaceholders(template: string, replacements: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return result;
}

/**
 * Estima a duração da leitura de um texto em segundos
 */
function estimateReadingDuration(text: string): number {
  // Média de leitura em português: aproximadamente 150 palavras por minuto em voz alta
  const words = text.split(' ').length;
  const minutesFloat = words / 150;
  const seconds = Math.ceil(minutesFloat * 60);
  return seconds;
}

/**
 * Gera um script de vídeo localmente com base em um tema e opções
 */
export async function generateLocalScript(
  theme: string,
  targetAudience: string = 'geral',
  options: ScriptGenerationOptions = {}
): Promise<ScriptGenerationResult> {
  try {
    // Início do tempo para medir duração
    const startTime = Date.now();
    
    // Definir valores padrão para opções
    const {
      duração = 60,
      tom = 'profissional',
      formato = 'explicativo',
      idioma = 'pt-BR',
      incluirChamadaAção = true
    } = options;
    
    // Identificar tema principal e subtema
    let mainTheme = 'geral';
    let subTheme = theme.toLowerCase();
    
    // Determinar a categoria do tema
    for (const [themeName, keywords] of Object.entries(popularThemes)) {
      if (theme.toLowerCase().includes(themeName)) {
        mainTheme = themeName;
        break;
      }
      
      for (const keyword of keywords) {
        if (theme.toLowerCase().includes(keyword)) {
          mainTheme = themeName;
          subTheme = keyword;
          break;
        }
      }
    }
    
    // Selecionar o template apropriado
    const template = scriptTemplates[formato as keyof typeof scriptTemplates];
    if (!template) {
      throw new Error(`Formato de script não suportado: ${formato}`);
    }
    
    // Criar título
    let titleVariations = [
      `Como ${theme} pode transformar sua vida`,
      `Tudo o que você precisa saber sobre ${theme}`,
      `${theme}: um guia completo para iniciantes`,
      `Os segredos de ${theme} revelados`,
      `Dominando ${theme} em ${Math.floor(duração / 60)} minutos`,
    ];
    
    if (formato === 'lista') {
      titleVariations = [
        `${Math.min(7, Math.max(3, Math.floor(duração / 60)))} dicas essenciais sobre ${theme}`,
        `Top ${Math.min(10, Math.max(3, Math.floor(duração / 60)))} segredos para ${theme}`,
        `${Math.min(5, Math.max(3, Math.floor(duração / 60)))} técnicas para dominar ${theme}`,
        `${Math.min(7, Math.max(3, Math.floor(duração / 60)))} erros comuns ao lidar com ${theme}`,
        `${Math.min(5, Math.max(3, Math.floor(duração / 60)))} passos para se destacar em ${theme}`,
      ];
    }
    
    const title = randomChoice(titleVariations);
    
    // Preparar dados para os placeholders
    const placeholderData: Record<string, string> = {
      tema: theme,
      personagem: targetAudience === 'geral' ? 'alguém' : targetAudience,
      número: Math.min(7, Math.max(3, Math.floor(duração / 60))).toString(),
    };
    
    // Para formato de lista, adicionar placeholders para os itens
    if (formato === 'lista') {
      const numberOfItems = parseInt(placeholderData.número);
      for (let i = 1; i <= numberOfItems; i++) {
        placeholderData[`n${i}`] = i.toString();
        placeholderData[`item${i}`] = `dica importante sobre ${theme}`;
        placeholderData[`razão${i}`] = `isso pode melhorar seus resultados significativamente`;
      }
    }
    
    // Para tutorial, adicionar placeholders para os passos
    if (formato === 'tutorial') {
      for (let i = 1; i <= 6; i++) {
        placeholderData[`ação${i}`] = `realizar o passo ${i} relacionado a ${theme}`;
      }
      for (let i = 1; i <= 3; i++) {
        placeholderData[`dica${i}`] = `considerar aspecto importante sobre ${theme}`;
      }
      placeholderData[`erro_comum`] = `não prestar atenção em detalhes importantes`;
      placeholderData[`lembrança`] = `praticar regularmente`;
    }
    
    // Para explicativo, adicionar placeholders para conceitos
    if (formato === 'explicativo') {
      for (let i = 1; i <= 5; i++) {
        placeholderData[`conceito${i}`] = `existe um aspecto importante relacionado a ${theme}`;
        placeholderData[`exemplo${i}`] = `ocorre uma situação específica com ${theme}`;
      }
    }
    
    // Para storytelling, adicionar placeholders específicos
    if (formato === 'storytelling') {
      placeholderData[`situação_hipotética`] = `alguém enfrentasse um desafio com ${theme}`;
      placeholderData[`início`] = `uma situação inesperada aconteceu`;
      placeholderData[`crença_inicial`] = `seria fácil lidar com ${theme}`;
      placeholderData[`realidade`] = `havia muito mais a aprender`;
      placeholderData[`obstáculo`] = `surgiu um problema inesperado`;
      placeholderData[`qualidade`] = `perseverança`;
      placeholderData[`complicação`] = `as coisas pareciam estar dando errado`;
      placeholderData[`reviravolta`] = `havia uma oportunidade escondida`;
      placeholderData[`descoberta`] = `a abordagem precisava ser completamente diferente`;
      placeholderData[`lição`] = `a persistência sempre compensa`;
      placeholderData[`clímax`] = `chegou o momento crucial de tomar uma decisão`;
      placeholderData[`momento_chave`] = `uma nova perspectiva surgiu`;
      placeholderData[`revelação`] = `o verdadeiro propósito de ${theme} ficou claro`;
      placeholderData[`decisão`] = `seguir em frente apesar das dificuldades`;
      placeholderData[`virada`] = `tudo começou a fazer sentido`;
      placeholderData[`lição_moral`] = `nunca desistir dos nossos objetivos`;
    }
    
    // Gerar as seções do script
    const sections: string[] = [];
    let fullScript = '';
    
    // Introdução
    const intro = replacePlaceholders(randomChoice(template.intro), placeholderData);
    sections.push('INTRODUÇÃO:\n' + intro);
    fullScript += 'INTRODUÇÃO:\n' + intro + '\n\n';
    
    // Corpo do script (varia conforme o formato)
    if (formato === 'tutorial') {
      let body = 'PASSOS:\n';
      for (let i = 0; i < Math.min(4, Math.max(2, Math.floor(duração / 30))); i++) {
        const step = replacePlaceholders(randomChoice(template.steps), {
          ...placeholderData,
          ação1: placeholderData[`ação${i+1}`] || `realizar uma ação importante relacionada a ${theme}`,
        });
        body += `${i+1}. ${step}\n`;
      }
      
      // Adicionar dicas
      body += '\nDICAS:\n';
      for (let i = 0; i < Math.min(2, Math.floor(duração / 60)); i++) {
        const tip = replacePlaceholders(randomChoice(template.tips), {
          ...placeholderData,
          dica1: placeholderData[`dica${i+1}`] || `considerar aspecto importante sobre ${theme}`,
        });
        body += `- ${tip}\n`;
      }
      
      sections.push(body);
      fullScript += body + '\n\n';
      
    } else if (formato === 'explicativo') {
      let body = 'CONCEITOS PRINCIPAIS:\n';
      for (let i = 0; i < Math.min(4, Math.max(2, Math.floor(duração / 30))); i++) {
        const concept = replacePlaceholders(randomChoice(template.concepts), {
          ...placeholderData,
          conceito1: placeholderData[`conceito${i+1}`] || `existe um aspecto importante relacionado a ${theme}`,
        });
        body += `- ${concept}\n`;
      }
      
      // Adicionar exemplos
      body += '\nEXEMPLOS:\n';
      for (let i = 0; i < Math.min(3, Math.max(1, Math.floor(duração / 40))); i++) {
        const example = replacePlaceholders(randomChoice(template.examples), {
          ...placeholderData,
          exemplo1: placeholderData[`exemplo${i+1}`] || `ocorre uma situação específica com ${theme}`,
        });
        body += `- ${example}\n`;
      }
      
      sections.push(body);
      fullScript += body + '\n\n';
      
    } else if (formato === 'lista') {
      let body = 'ITENS:\n';
      const numItems = parseInt(placeholderData.número);
      
      for (let i = 1; i <= numItems; i++) {
        const item = replacePlaceholders(randomChoice(template.items), {
          ...placeholderData,
          n: i.toString(),
          item: placeholderData[`item${i}`] || `dica importante sobre ${theme}`,
          razão: placeholderData[`razão${i}`] || `isso pode melhorar seus resultados significativamente`,
        });
        body += item + '\n\n';
      }
      
      sections.push(body);
      fullScript += body + '\n\n';
      
    } else if (formato === 'storytelling') {
      let body = 'DESENVOLVIMENTO:\n';
      for (let i = 0; i < Math.min(3, Math.max(1, Math.floor(duração / 40))); i++) {
        body += replacePlaceholders(randomChoice(template.development), placeholderData) + '\n\n';
      }
      
      body += 'CLÍMAX:\n';
      body += replacePlaceholders(randomChoice(template.climax), placeholderData);
      
      sections.push(body);
      fullScript += body + '\n\n';
    }
    
    // Conclusão
    const conclusion = replacePlaceholders(randomChoice(template.conclusion), placeholderData);
    sections.push('CONCLUSÃO:\n' + conclusion);
    fullScript += 'CONCLUSÃO:\n' + conclusion + '\n\n';
    
    // Adicionar chamada à ação se solicitado
    if (incluirChamadaAção) {
      let ctaType: keyof typeof callsToAction = 'genérico';
      
      // Determinar o tipo de CTA com base no tema
      if (mainTheme === 'finanças pessoais' || mainTheme === 'marketing digital' || mainTheme === 'tecnologia') {
        ctaType = 'negócios';
      } else if (mainTheme === 'educação' || mainTheme === 'tecnologia') {
        ctaType = 'educacional';
      } else if (mainTheme === 'desenvolvimento pessoal' || mainTheme === 'saúde e bem-estar') {
        ctaType = 'pessoal';
      }
      
      const cta = replacePlaceholders(randomChoice(callsToAction[ctaType]), placeholderData);
      sections.push('CHAMADA À AÇÃO:\n' + cta);
      fullScript += 'CHAMADA À AÇÃO:\n' + cta;
    }
    
    // Estimar duração real baseada no texto gerado
    const estimatedDuration = estimateReadingDuration(fullScript);
    
    // Log de conclusão
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    log(`Script local gerado em ${processingTime}ms, duração estimada: ${estimatedDuration}s`, 'info');
    
    return {
      script: fullScript,
      title,
      sections,
      estimatedDuration,
      model: 'local-script-generator',
      requestId: nanoid()
    };
  } catch (error) {
    log('Erro ao gerar script localmente:', 'error');
    log(error, 'error');
    
    // Resposta em caso de erro
    return {
      script: 'Não foi possível gerar o script. Por favor, tente novamente mais tarde.',
      title: 'Erro na geração de script',
      sections: ['Erro'],
      estimatedDuration: 0,
      model: 'local-script-generator',
      requestId: nanoid()
    };
  }
}