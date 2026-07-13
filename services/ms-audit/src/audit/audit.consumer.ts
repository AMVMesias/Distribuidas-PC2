import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { AuditService } from './audit.service';
import { CreateAuditEventDto } from './dto/create-audit.dto';

@Injectable()
export class AuditConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditConsumer.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private retryTimer?: NodeJS.Timeout;
  private connecting = false;
  private stopping = false;

  constructor(
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  onModuleInit(): void {
    void this.connectAndConsume();
  }

  async onModuleDestroy(): Promise<void> {
    this.stopping = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    await this.closeConnection();
  }

  private async connectAndConsume(): Promise<void> {
    if (this.stopping || this.connecting || this.channel) return;
    this.connecting = true;

    try {
      const connection = await amqp.connect(this.connectionUrl(), {
        timeout: Number(this.config.get('RABBITMQ_CONNECTION_TIMEOUT_MS', '2000')),
      });
      const channel = await connection.createChannel();
      await this.configureChannel(channel);

      connection.once('close', () => {
        if (this.connection === connection) {
          this.connection = undefined;
          this.channel = undefined;
          this.scheduleReconnect();
        }
      });
      connection.on('error', (error) => {
        this.logger.warn(`Conexión RabbitMQ interrumpida: ${error.message}`);
      });

      this.connection = connection;
      this.channel = channel;
      this.logger.log(`Consumidor conectado a RabbitMQ en ${this.config.get('RABBITMQ_HOST', 'localhost')}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(`RabbitMQ no disponible: ${message}`);
      await this.closeConnection();
      this.scheduleReconnect();
    } finally {
      this.connecting = false;
    }
  }

  private async configureChannel(channel: amqp.Channel): Promise<void> {
    const queue = this.config.get('RABBITMQ_QUEUE', 'audit_queue');
    const exchange = this.config.get('RABBITMQ_EXCHANGE', 'audit_exchange');
    const routingKey = this.config.get('RABBITMQ_ROUTING_KEY', 'audit_event');
    const deadExchange = this.config.get('RABBITMQ_DEAD_LETTER_EXCHANGE', 'audit_dead_exchange');
    const deadQueue = `${queue}.dead`;

    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertExchange(deadExchange, 'fanout', { durable: true });
    await channel.assertQueue(deadQueue, { durable: true });
    await channel.bindQueue(deadQueue, deadExchange, '');
    await channel.assertQueue(queue, {
      durable: true,
      arguments: { 'x-dead-letter-exchange': deadExchange },
    });
    await channel.bindQueue(queue, exchange, routingKey);
    await channel.prefetch(Number(this.config.get('RABBITMQ_PREFETCH', '10')));
    await channel.consume(queue, async (message) => this.processMessage(channel, message), { noAck: false });
  }

  private async processMessage(channel: amqp.Channel, message: amqp.ConsumeMessage | null): Promise<void> {
    if (!message) return;

    try {
      const raw: unknown = JSON.parse(message.content.toString());
      const dto = plainToInstance(CreateAuditEventDto, raw);
      const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
      if (errors.length > 0) {
        this.logger.warn(`Evento inválido enviado a DLQ: ${this.validationMessages(errors).join('; ')}`);
        channel.nack(message, false, false);
        return;
      }

      await this.auditService.create(dto);
      channel.ack(message);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Evento no procesado; enviado a DLQ: ${detail}`);
      channel.nack(message, false, false);
    }
  }

  private validationMessages(errors: ValidationError[]): string[] {
    return errors.flatMap((error) => Object.values(error.constraints ?? {}));
  }

  private scheduleReconnect(): void {
    if (this.stopping || this.retryTimer) return;
    const delay = Number(this.config.get('RABBITMQ_RETRY_MS', '5000'));
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      void this.connectAndConsume();
    }, delay);
  }

  private connectionUrl(): string {
    const host = this.config.get('RABBITMQ_HOST', 'localhost');
    const port = this.config.get('RABBITMQ_PORT', '5672');
    const user = encodeURIComponent(this.config.get('RABBITMQ_USER', 'guest'));
    const password = encodeURIComponent(this.config.get('RABBITMQ_PASSWORD', 'guest'));
    return `amqp://${user}:${password}@${host}:${port}`;
  }

  private async closeConnection(): Promise<void> {
    const channel = this.channel;
    const connection = this.connection;
    this.channel = undefined;
    this.connection = undefined;
    await Promise.allSettled([channel?.close(), connection?.close()]);
  }
}
