import Server from './server';
import config from './config';
import { startConsumer } from './consumer';
import { startGrpcServer, stopGrpcServer } from './grpc';

const app = new Server();

// Start all services
async function bootstrap() {
  try {
    // Start HTTP server
    app.start(config.serverPort);

    // Start gRPC server
    await startGrpcServer();

    // Start RabbitMQ consumer
    await startConsumer();
  } catch (err) {
    console.error('Failed to start services', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await stopGrpcServer();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await stopGrpcServer();
  process.exit(0);
});

bootstrap();
