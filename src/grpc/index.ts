import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ReflectionService } from '@grpc/reflection';
import path from 'path';
import config from '../config';
import logger from '../logger';
import { mailServiceHandlers } from './servers/mail.servers';

// Proto file path
const PROTO_PATH = path.join(__dirname, 'proto', 'mail.proto');

// Proto loader options for better TypeScript compatibility
const protoLoaderOptions: protoLoader.Options = {
  keepCase: false, // Convert to camelCase
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

// Load the proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, protoLoaderOptions);
const mailProto = grpc.loadPackageDefinition(packageDefinition) as any;

// gRPC Server instance
let grpcServer: grpc.Server | null = null;

/**
 * Start the gRPC server
 */
export const startGrpcServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      grpcServer = new grpc.Server();
      const reflectionService = new ReflectionService(packageDefinition);
      reflectionService.addToServer(grpcServer);

      // Add the MailerService with all handlers
      grpcServer.addService(
        mailProto.mail.MailerService.service,
        mailServiceHandlers
      );

      const grpcPort = config.grpcPort || 50051;
      const grpcHost = config.grpcHost || '0.0.0.0';
      const bindAddress = `${grpcHost}:${grpcPort}`;

      grpcServer.bindAsync(
        bindAddress,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) {
            logger.error({ error }, 'Failed to bind gRPC server');
            reject(error);
            return;
          }

          logger.info(
            { port: grpcPort, host: grpcHost },
            'gRPC Mail Service started'
          );
          console.log(`🚀 gRPC Mail Service running on ${bindAddress}`);
          resolve();
        }
      );
    } catch (error) {
      logger.error({ error }, 'Failed to start gRPC server');
      reject(error);
    }
  });
};

/**
 * Stop the gRPC server gracefully
 */
export const stopGrpcServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (grpcServer) {
      grpcServer.tryShutdown(() => {
        logger.info('gRPC server stopped gracefully');
        grpcServer = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
};

/**
 * Force stop the gRPC server
 */
export const forceStopGrpcServer = (): void => {
  if (grpcServer) {
    grpcServer.forceShutdown();
    grpcServer = null;
    logger.info('gRPC server force stopped');
  }
};

// Export proto for client usage
export { mailProto, PROTO_PATH, protoLoaderOptions };
