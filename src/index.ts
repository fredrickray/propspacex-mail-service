import Server from './server';
import config from './config';
import { startConsumer } from './consumer';

const app = new Server();
app.start(config.serverPort);

startConsumer().catch((err) => {
  console.error('Failed to start consumer', err);
  process.exit(1);
});
