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
  datos?: Record<string, unknown>;
  usuario: string;
  rol: string;
  ip: string;
  mac?: string;
}

@Injectable()
export class EventPublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.ConfirmChannel;
  private connecting?: Promise<amqp.ConfirmChannel>;

  constructor(private readonly config: ConfigService) {}

  async publish(event: AuditEvent): Promise<void> {
    try {
      const channel = await this.getChannel();
      const exchange = this.config.get('RABBITMQ_EXCHANGE', 'audit_exchange');
      const routingKey = this.config.get('RABBITMQ_ROUTING_KEY', 'audit_event');

      channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(event)), {
        contentType: 'application/json',
        persistent: true,
      });
      await channel.waitForConfirms();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(`No se pudo publicar auditoría: ${message}`);
      await this.closeConnection();
    }
  }

  async onModuleDestroy() {
    await this.closeConnection();
  }

  private async getChannel(): Promise<amqp.ConfirmChannel> {
    if (this.channel) return this.channel;
    if (this.connecting) return this.connecting;

    this.connecting = this.createChannel();
    try {
      return await this.connecting;
    } finally {
      this.connecting = undefined;
    }
  }

  private async createChannel(): Promise<amqp.ConfirmChannel> {
    const host = this.config.get('RABBITMQ_HOST', 'localhost');
    const port = this.config.get('RABBITMQ_PORT', '5672');
    const user = this.config.get('RABBITMQ_USER', 'guest');
    const password = this.config.get('RABBITMQ_PASSWORD', 'guest');
    const timeout = Number(this.config.get('RABBITMQ_CONNECTION_TIMEOUT_MS', '1500'));
    const url = `amqp://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}`;

    const connection = await amqp.connect(url, { timeout });
    const channel = await connection.createConfirmChannel();
    const exchange = this.config.get('RABBITMQ_EXCHANGE', 'audit_exchange');
    await channel.assertExchange(exchange, 'topic', { durable: true });

    connection.once('close', () => {
      if (this.connection === connection) {
        this.connection = undefined;
        this.channel = undefined;
      }
    });
    connection.on('error', (error) => {
      this.logger.warn(`Conexión RabbitMQ interrumpida: ${error.message}`);
    });

    this.connection = connection;
    this.channel = channel;
    return channel;
  }

  private async closeConnection(): Promise<void> {
    const channel = this.channel;
    const connection = this.connection;
    this.channel = undefined;
    this.connection = undefined;
    await Promise.allSettled([channel?.close(), connection?.close()]);
  }
}
