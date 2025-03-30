import { storage } from "../storage";
import { log } from "../vite";
import { EmailCampaign, Lead, AudienceSegment } from "@shared/schema";
import nodemailer from "nodemailer";

/**
 * Interface para provedores de serviço de email
 */
interface EmailProvider {
  name: string;
  send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
  testConnection(): Promise<boolean>;
}

/**
 * Opções para envio de email
 */
interface EmailOptions {
  to: string;
  from: { name: string; email: string };
  subject: string;
  html: string;
  text?: string;
}

/**
 * Implementação de fallback local para envio de emails usando Nodemailer
 */
class NodemailerProvider implements EmailProvider {
  name = "nodemailer";
  private transporter: nodemailer.Transporter;

  constructor(host = "localhost", port = 1025) {
    // Configuração para modo de desenvolvimento usando MailHog ou similar
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: null,
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.transporter.sendMail({
        from: `"${options.from.name}" <${options.from.email}>`,
        to: options.to,
        subject: options.subject,
        text: options.text || "",
        html: options.html
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      log(`Erro ao enviar email com Nodemailer: ${error.message}`, "email-service");
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      log(`Falha na verificação de conexão do Nodemailer: ${error.message}`, "email-service");
      return false;
    }
  }
}

/**
 * Provedor de Email usando SMTP
 */
class SmtpProvider implements EmailProvider {
  name = "smtp";
  private transporter: nodemailer.Transporter;

  constructor(config: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  }) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.transporter.sendMail({
        from: `"${options.from.name}" <${options.from.email}>`,
        to: options.to,
        subject: options.subject,
        text: options.text || "",
        html: options.html
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      log(`Erro ao enviar email com SMTP: ${error.message}`, "email-service");
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      log(`Falha na verificação de conexão SMTP: ${error.message}`, "email-service");
      return false;
    }
  }
}

/**
 * Serviço de Email Marketing com sistema de fallback
 */
export class EmailMarketingService {
  private providers: EmailProvider[] = [];
  private defaultProvider: EmailProvider;
  private activeProvider: EmailProvider | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    // Inicializar provedor padrão (Nodemailer local)
    this.defaultProvider = new NodemailerProvider();
    this.providers.push(this.defaultProvider);

    // Adicionar provedores adicionais se configurados
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpSecure = process.env.SMTP_SECURE === "true";

    if (smtpHost && smtpUser && smtpPass) {
      const smtpProvider = new SmtpProvider({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: smtpUser,
        pass: smtpPass
      });
      this.providers.push(smtpProvider);
    }

    // Testar conexões e definir provedor ativo
    this.detectActiveProvider();

    // Iniciar processamento de campanhas em intervalos regulares
    this.startCampaignProcessor();
  }

  /**
   * Testa as conexões dos provedores e define o provedor ativo
   */
  async detectActiveProvider(): Promise<void> {
    for (const provider of this.providers) {
      try {
        const isConnected = await provider.testConnection();
        if (isConnected) {
          this.activeProvider = provider;
          log(`Provedor de email ativo: ${provider.name}`, "email-service");
          return;
        }
      } catch (error) {
        log(`Falha ao testar provedor ${provider.name}: ${error.message}`, "email-service");
      }
    }

    // Se nenhum provedor estiver disponível, usar o provedor padrão
    this.activeProvider = this.defaultProvider;
    log("Nenhum provedor externo disponível, usando provedor padrão", "email-service");
  }

  /**
   * Envia um email usando o provedor ativo com sistema de fallback
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; provider: string; error?: string }> {
    // Tentar com o provedor ativo primeiro
    if (this.activeProvider) {
      try {
        const result = await this.activeProvider.send(options);
        if (result.success) {
          return {
            success: true,
            provider: this.activeProvider.name
          };
        }
      } catch (error) {
        log(
          `Falha ao enviar email com provedor ${this.activeProvider.name}: ${error.message}`,
          "email-service"
        );
      }
    }

    // Se o provedor ativo falhar, tente outros provedores
    for (const provider of this.providers) {
      if (provider === this.activeProvider) continue; // Pular o provedor que já falhou

      try {
        const result = await provider.send(options);
        if (result.success) {
          // Atualizar o provedor ativo
          this.activeProvider = provider;
          log(`Provedor de email alterado para ${provider.name}`, "email-service");
          return {
            success: true,
            provider: provider.name
          };
        }
      } catch (error) {
        log(`Falha ao enviar email com provedor alternativo ${provider.name}: ${error.message}`, "email-service");
      }
    }

    // Se todos os provedores falharem
    return {
      success: false,
      provider: "none",
      error: "Todos os provedores de email falharam"
    };
  }

  /**
   * Inicia o processador de campanhas agendadas
   */
  startCampaignProcessor(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Verificar campanhas agendadas a cada 5 minutos
    this.intervalId = setInterval(() => {
      this.processScheduledCampaigns().catch(error => {
        log(`Erro ao processar campanhas agendadas: ${error.message}`, "email-service");
      });
    }, 5 * 60 * 1000);

    log("Processador de campanhas de email iniciado", "email-service");
  }

  /**
   * Para o processador de campanhas agendadas
   */
  stopCampaignProcessor(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      log("Processador de campanhas de email parado", "email-service");
    }
  }

  /**
   * Processa campanhas de email agendadas
   */
  async processScheduledCampaigns(): Promise<void> {
    const now = new Date();

    // Buscar todas as campanhas com status "scheduled" que já devem ser enviadas
    const users = await storage.getAllUsers();

    for (const user of users) {
      const campaigns = await storage.getEmailCampaigns(user.id);
      const scheduledCampaigns = campaigns.filter(
        campaign =>
          campaign.status === "scheduled" &&
          campaign.scheduledAt &&
          new Date(campaign.scheduledAt) <= now
      );

      // Processar cada campanha agendada
      for (const campaign of scheduledCampaigns) {
        try {
          // Atualizar status para "sending"
          await storage.updateEmailCampaign(campaign.id, {
            status: "sending"
          });

          // Processar a campanha
          const result = await this.processCampaign(campaign);

          // Atualizar status com base no resultado
          const newStatus = result.success ? "sent" : "failed";
          const sentAt = result.success ? new Date() : undefined;
          const stats = result.success
            ? {
                totalSent: result.totalSent,
                totalFailed: result.totalFailed,
                sentAt: sentAt?.toISOString()
              }
            : { error: result.error };

          await storage.updateEmailCampaign(campaign.id, {
            status: newStatus,
            sentAt,
            stats
          });

          log(
            `Campanha ${campaign.id} processada: ${result.success ? "sucesso" : "falha"} - Enviados: ${
              result.totalSent
            }, Falhas: ${result.totalFailed}`,
            "email-service"
          );
        } catch (error) {
          log(`Erro ao processar campanha ${campaign.id}: ${error.message}`, "email-service");
          await storage.updateEmailCampaign(campaign.id, {
            status: "failed",
            stats: { error: error.message }
          });
        }
      }
    }
  }

  /**
   * Processa uma campanha de email, enviando para os leads relevantes
   */
  async processCampaign(
    campaign: EmailCampaign
  ): Promise<{
    success: boolean;
    totalSent: number;
    totalFailed: number;
    error?: string;
  }> {
    try {
      // Buscar leads com base no segmento
      let leads: Lead[] = [];

      if (campaign.segmentId) {
        // Buscar o segmento
        const segment = await storage.getAudienceSegment(campaign.segmentId);
        if (!segment) {
          throw new Error(`Segmento não encontrado: ${campaign.segmentId}`);
        }

        // Aplicar critérios do segmento aos leads
        leads = await this.getLeadsBySegment(segment);
      } else {
        // Sem segmento, enviar para todos os leads do usuário
        leads = await storage.getLeads(campaign.userId);
      }

      if (leads.length === 0) {
        return {
          success: true,
          totalSent: 0,
          totalFailed: 0,
          error: "Nenhum lead encontrado para a campanha"
        };
      }

      let totalSent = 0;
      let totalFailed = 0;

      // Enviar para cada lead
      for (const lead of leads) {
        try {
          if (!lead.email) {
            totalFailed++;
            continue;
          }

          // Personalizar conteúdo do email
          const personalizedHtml = this.personalizeContent(campaign.body, lead);
          const personalizedSubject = this.personalizeContent(campaign.subject, lead);

          // Enviar email
          const result = await this.sendEmail({
            to: lead.email,
            from: {
              name: campaign.fromName,
              email: campaign.fromEmail
            },
            subject: personalizedSubject,
            html: personalizedHtml
          });

          if (result.success) {
            totalSent++;
          } else {
            totalFailed++;
          }
        } catch (error) {
          log(`Erro ao enviar email para ${lead.email}: ${error.message}`, "email-service");
          totalFailed++;
        }

        // Pequena pausa entre envios para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        success: true,
        totalSent,
        totalFailed
      };
    } catch (error) {
      log(`Erro ao processar campanha ${campaign.id}: ${error.message}`, "email-service");
      return {
        success: false,
        totalSent: 0,
        totalFailed: 0,
        error: error.message
      };
    }
  }

  /**
   * Recupera leads que correspondem aos critérios de um segmento
   */
  async getLeadsBySegment(segment: AudienceSegment): Promise<Lead[]> {
    // Buscar todos os leads do usuário
    const allLeads = await storage.getLeads(segment.userId);

    // Se não houver critérios de segmentação, retornar todos os leads
    if (!segment.criteria || Object.keys(segment.criteria).length === 0) {
      return allLeads;
    }

    // Aplicar critérios de filtragem
    return allLeads.filter(lead => {
      // Verificar cada critério de filtragem
      for (const [key, value] of Object.entries(segment.criteria as Record<string, any>)) {
        if (key === "interest" && lead.interest) {
          if (Array.isArray(value)) {
            // Se o valor for um array, verificar se o interesse do lead está no array
            if (!value.includes(lead.interest)) {
              return false;
            }
          } else if (typeof value === "string" && lead.interest !== value) {
            // Se o valor for uma string, verificar se é igual ao interesse do lead
            return false;
          }
        }

        // Adicionar outros critérios conforme necessário
        // Por exemplo, filtrar por data de criação
        if (key === "createdAfter" && lead.createdAt) {
          const createdAfterDate = new Date(value);
          const leadCreatedAt = new Date(lead.createdAt);
          if (leadCreatedAt < createdAfterDate) {
            return false;
          }
        }

        if (key === "createdBefore" && lead.createdAt) {
          const createdBeforeDate = new Date(value);
          const leadCreatedAt = new Date(lead.createdAt);
          if (leadCreatedAt > createdBeforeDate) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Personaliza o conteúdo de um email com dados do lead
   */
  personalizeContent(content: string, lead: Lead): string {
    // Substituir variáveis de template
    let personalized = content;
    personalized = personalized.replace(/\{\{nome\}\}/g, lead.name || "");
    personalized = personalized.replace(/\{\{email\}\}/g, lead.email || "");
    personalized = personalized.replace(/\{\{telefone\}\}/g, lead.phone || "");
    personalized = personalized.replace(/\{\{interesse\}\}/g, lead.interest || "");

    // Formato de data brasileiro
    if (lead.createdAt) {
      const dataBrasil = new Date(lead.createdAt).toLocaleDateString("pt-BR");
      personalized = personalized.replace(/\{\{data_cadastro\}\}/g, dataBrasil);
    }

    return personalized;
  }

  /**
   * Agenda o envio de uma campanha
   */
  async scheduleCampaign(campaignId: number, scheduledAt: Date): Promise<EmailCampaign> {
    const campaign = await storage.getEmailCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campanha não encontrada: ${campaignId}`);
    }

    // Verificar se a campanha pode ser agendada
    if (campaign.status !== "draft") {
      throw new Error(`Campanha não pode ser agendada. Status atual: ${campaign.status}`);
    }

    // Atualizar a campanha
    const updated = await storage.updateEmailCampaign(campaignId, {
      status: "scheduled",
      scheduledAt
    });

    log(`Campanha ${campaignId} agendada para ${scheduledAt.toISOString()}`, "email-service");
    return updated;
  }

  /**
   * Envia uma campanha imediatamente
   */
  async sendCampaignNow(campaignId: number): Promise<EmailCampaign> {
    const campaign = await storage.getEmailCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campanha não encontrada: ${campaignId}`);
    }

    // Verificar se a campanha pode ser enviada
    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      throw new Error(`Campanha não pode ser enviada. Status atual: ${campaign.status}`);
    }

    // Atualizar status da campanha
    await storage.updateEmailCampaign(campaignId, {
      status: "sending"
    });

    // Processar a campanha em background
    this.processCampaign(campaign)
      .then(async result => {
        const newStatus = result.success ? "sent" : "failed";
        const sentAt = result.success ? new Date() : undefined;
        const stats = result.success
          ? {
              totalSent: result.totalSent,
              totalFailed: result.totalFailed,
              sentAt: sentAt?.toISOString()
            }
          : { error: result.error };

        await storage.updateEmailCampaign(campaignId, {
          status: newStatus,
          sentAt,
          stats
        });

        log(
          `Campanha ${campaignId} processada: ${result.success ? "sucesso" : "falha"} - Enviados: ${
            result.totalSent
          }, Falhas: ${result.totalFailed}`,
          "email-service"
        );
      })
      .catch(async error => {
        log(`Erro ao processar campanha ${campaignId}: ${error.message}`, "email-service");
        await storage.updateEmailCampaign(campaignId, {
          status: "failed",
          stats: { error: error.message }
        });
      });

    // Retornar a campanha com status atualizado
    return await storage.getEmailCampaign(campaignId);
  }

  /**
   * Cancela uma campanha agendada
   */
  async cancelCampaign(campaignId: number): Promise<EmailCampaign> {
    const campaign = await storage.getEmailCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campanha não encontrada: ${campaignId}`);
    }

    // Verificar se a campanha pode ser cancelada
    if (campaign.status !== "scheduled") {
      throw new Error(`Campanha não pode ser cancelada. Status atual: ${campaign.status}`);
    }

    // Atualizar a campanha
    const updated = await storage.updateEmailCampaign(campaignId, {
      status: "draft",
      scheduledAt: null
    });

    log(`Campanha ${campaignId} cancelada`, "email-service");
    return updated;
  }

  /**
   * Testa o envio de um email para um endereço específico
   */
  async testSendEmail(
    toEmail: string,
    fromName: string,
    fromEmail: string,
    subject: string,
    html: string
  ): Promise<{ success: boolean; provider: string; error?: string }> {
    return this.sendEmail({
      to: toEmail,
      from: { name: fromName, email: fromEmail },
      subject: `[TESTE] ${subject}`,
      html: `
        <div style="background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f2f2f2; color: #666; padding: 10px; text-align: center; margin-bottom: 20px;">
              <strong>ISTO É UM TESTE DE EMAIL - NÃO RESPONDA</strong>
            </div>
            ${html}
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              <p>Este é um email de teste enviado pelo sistema de email marketing.</p>
            </div>
          </div>
        </div>
      `
    });
  }
}

// Exportar uma instância única do serviço
export const emailMarketingService = new EmailMarketingService();