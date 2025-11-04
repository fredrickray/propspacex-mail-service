import amqp, { Connection, Channel, ChannelModel } from 'amqplib';
import config from './config';
import logger from './logger';
import { BadRequest } from '@middlewares/error.middleware';

let connection: Connection | ChannelModel | null = null;
let channel: Channel | null = null;

export async function getChannel(): Promise<Channel> {
  if (channel) return channel;

  const url = config.rabbitUrl;
  if (!url) throw new BadRequest('RABBIT_URL is not set');

  connection = await amqp.connect(url);

  const ch = await connection!.createChannel();

  // main queue with dead-letter exchange to DLX
  await ch.assertExchange('email_exchange', 'direct', { durable: true });
  await ch.assertExchange('email_dlx_exchange', 'fanout', {
    durable: true,
  });

  await ch.assertQueue(config.emailDLX!, { durable: true });
  await ch.bindQueue(config.emailDLX!, 'email_dlx_exchange', '');

  await ch.assertQueue(config.emailQueue!, {
    durable: true,
    deadLetterExchange: 'email_dlx_exchange',
  });

  logger.info('RabbitMQ: connected and queues asserted');
  channel = ch;
  return ch;
}

export async function closeConnection() {
  try {
    if (channel) {
      await (channel as any).close();
    }

    if (connection) {
      // Cast the connection to 'any' to bypass the missing 'close' property error
      await (connection as any).close();
    }
  } catch (err) {
    logger.warn({ err }, 'Error closing Rabbit connection');
  }
}
