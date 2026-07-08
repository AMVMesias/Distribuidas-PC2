import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditRequestContext {
  ip?: string;
}

export interface AuditEvent {
  servicio: string;
  accion: AuditAction;
  entidad: string;
  datos?: Record<string, any>;
  usuario: string;
  rol: string;
  ip: string;
  mac: string;
}

@Injectable()
export class EventPublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection?: any;
  private channel?: any;

  constructor(private readonly config: ConfigService) {}

  async publish(event: AuditEvent): Promise<void> {
    try {
      const channel = await this.getChannel();
      const exchange = this.config.get('RABBITMQ_EXCHANGE', 'audit_exchange');
      const routingKey = this.config.get('RABBITMQ_ROUTING_KEY', 'audit_event');

      await channel.assertExchange(exchange, 'topic', { durable: true });
      channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(event)), {
        contentType: 'application/json',
        persistent: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(`No se pudo publicar auditoría: ${message}`);
    }
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }

  private async getChannel() {
    if (this.channel) return this.channel;

    const host = this.config.get('RABBITMQ_HOST', 'localhost');
    const port = this.config.get('RABBITMQ_PORT', '5672');
    const user = this.config.get('RABBITMQ_USER', 'guest');
    const password = this.config.get('RABBITMQ_PASSWORD', 'guest');
    const url = `amqp://${user}:${password}@${host}:${port}`;

    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    return this.channel;
  }

}
