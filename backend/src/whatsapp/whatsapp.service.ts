import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OrderNotification {
  id: string;
  total: number;
  customerName: string | null;
  customerPhone: string | null;
  market: { name: string; whatsapp: string | null };
}

interface TemplateParameter {
  type: 'text';
  text: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly config: ConfigService) {}

  async sendOrderConfirmation(order: OrderNotification): Promise<void> {
    const customerPhone = this.normalizePhone(order.customerPhone);
    const marketPhone = this.normalizePhone(order.market.whatsapp);
    const orderNumber = order.id.slice(0, 8).toUpperCase();
    const total = order.total.toFixed(2).replace('.', ',');

    await Promise.allSettled([
      customerPhone
        ? this.sendTemplate(
            customerPhone,
            this.config.get<string>('WHATSAPP_CUSTOMER_TEMPLATE') ??
              'order_confirmation_customer',
            [
              order.customerName || 'cliente',
              orderNumber,
              total,
              order.market.name,
            ],
          )
        : Promise.resolve(),
      marketPhone
        ? this.sendTemplate(
            marketPhone,
            this.config.get<string>('WHATSAPP_MARKET_TEMPLATE') ??
              'order_confirmation_market',
            [orderNumber, order.customerName || 'Cliente', total],
          )
        : Promise.resolve(),
    ]).then((results) => {
      for (const result of results) {
        if (result.status === 'rejected') {
          this.logger.error(
            `Falha ao enviar confirmação de pedido: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
          );
        }
      }
    });
  }

  private normalizePhone(value: string | null): string | null {
    if (!value) return null;
    const digits = value.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      this.logger.warn(
        'Telefone inválido; notificação de WhatsApp não enviada.',
      );
      return null;
    }
    return digits.startsWith('55') ? digits : `55${digits}`;
  }

  private async sendTemplate(
    to: string,
    templateName: string,
    values: string[],
  ): Promise<void> {
    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const apiVersion = this.config.get<string>('WHATSAPP_GRAPH_API_VERSION');

    if (!accessToken || !phoneNumberId || !apiVersion) {
      this.logger.warn(
        'WhatsApp não configurado; confirmação de pedido não enviada.',
      );
      return;
    }

    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' },
            components: [
              {
                type: 'body',
                parameters: values.map(
                  (text): TemplateParameter => ({ type: 'text', text }),
                ),
              },
            ],
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`WhatsApp API respondeu HTTP ${response.status}.`);
    }
  }
}
