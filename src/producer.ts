import { getChannel } from './queue';
import { EmailJob } from './types';
import logger from './logger';
import config from './config';

export async function enqueueEmail(job: EmailJob) {
  const ch = await getChannel();
  const payload = Buffer.from(JSON.stringify(job));
  //   persistent deliveryMode = 2
  const ok = ch.sendToQueue(config.emailQueue, payload, {
    persistent: true,
  });
  logger.info({ job }, 'Enqueued email job');
  return ok;
}
