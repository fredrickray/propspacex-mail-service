import express, { Application } from 'express';
import config from './config';
import { enqueueEmail } from './producer';
import logger from './logger';

export default class Server {
  public app: Application;

  constructor() {
    this.app = express();
    this.app.use(express.json());
    console.log('Registering middlewares...');
  }

  handleErrors() {
    // this.app.use(errorHandler);
    // this.app.use(routeNotFound);
  }

  routes() {
    this.app.get('/v1/api', (req, res) => {
      res.send({
        success: true,
        message: 'Server initialized and ready for action!',
      });
    });
    this.app.use('/v1/api/send', async (req, res) => {
      try {
        const { to, subject, template, data, html } = req.body;
        if (!to || !subject)
          return res.status(400).json({ error: 'to and subject are required' });

        const job = { to, subject, template, data, html };
        await enqueueEmail(job);
        return res.status(202).json({ status: 'queued' });
      } catch (err) {
        logger.error({ err }, 'Failed to enqueue');
        return res.status(500).json({ error: 'failed to enqueue' });
      }
    });

    this.app.get('/v1/api/health', (req, res) =>
      res.json({ status: 'ok', env: config.serverEnvironment })
    );
  }

  start(port: number) {
    this.app.listen(port, () => {
      console.log(`Mail Server initialized and ready for action! 🤖`);
      console.log('     /\\_/\\');
      console.log('    / o o \\');
      console.log('   (   "   )');
      console.log('    \\~(*)~/');
      console.log('     /___\\');
      console.log('Welcome to the enchanted forest of code!');
    });
  }
}
