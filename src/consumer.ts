import { getChannel } from './queue';
import { EmailOptions } from './types';
import sendMail from './mailer';
import logger from './logger';
import config from './config';

export async function startConsumer() {
  const ch = await getChannel();

  await ch.prefetch(5);

  ch.consume(
    config.emailQueue,
    async (msg) => {
      if (!msg) return;

      try {
        const job: EmailOptions = JSON.parse(msg.content.toString());
        job.retries = job.retries ?? 0;

        logger.info({ job }, 'Processing email job');

        await sendMail(job);

        ch.ack(msg);
      } catch (err) {
        logger.error({ err }, 'Error processing job');

        try {
          const job: EmailOptions = JSON.parse(msg.content.toString());
          job.retries = (job.retries || 0) + 1;

          if (job.retries > config.retryAttempts) {
            logger.warn({ job }, 'Exceeded retries — sending to DLX');

            ch.publish(
              'email_dlx_exchange',
              '',
              Buffer.from(JSON.stringify(job)),
              { persistent: true }
            );

            ch.ack(msg);
          } else {
            const delay = Math.min(30000, 1000 * 2 ** job.retries);

            setTimeout(() => {
              ch.sendToQueue(
                config.emailQueue,
                Buffer.from(JSON.stringify(job)),
                { persistent: true }
              );
            }, delay);

            ch.ack(msg);
          }
        } catch (e) {
          logger.error({ e }, 'Requeue failed — dropping message');
          ch.ack(msg);
        }
      }
    },
    { noAck: false }
  );

  logger.info('Consumer started');
}
