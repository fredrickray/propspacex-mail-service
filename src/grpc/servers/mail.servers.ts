import * as grpc from '@grpc/grpc-js';
import { enqueueEmail } from '../../producer';
import logger from '../../logger';
import { v4 as uuidv4 } from 'uuid';

// Type definitions for gRPC handlers
// Note: keepCase: false in proto-loader converts snake_case to camelCase
type GrpcCallback<T> = (error: grpc.ServiceError | null, response: T) => void;

interface SendEmailRequest {
  recipientEmail: string;
  subject: string;
  bodyHtml?: string;
  templateName?: string;
  placeholders?: Record<string, string>;
}

interface WelcomeEmailRequest {
  recipientEmail: string;
  firstName: string;
  lastName: string;
  appRole: string;
  verificationLink?: string;
}

interface VerificationEmailRequest {
  recipientEmail: string;
  verificationCode: string;
}

interface PasswordResetEmailRequest {
  recipientEmail: string;
  firstName: string;
  resetLink: string;
  resetCode?: string;
  expiryMinutes: number;
}

interface PasswordChangedEmailRequest {
  recipientEmail: string;
  firstName: string;
  changedAt: string;
  ipAddress: string;
  deviceInfo: string;
  location: string;
}

interface LoginAlertEmailRequest {
  recipientEmail: string;
  firstName: string;
  loginTime: string;
  ipAddress: string;
  deviceInfo: string;
  location: string;
  isNewDevice: boolean;
}

interface InvitationEmailRequest {
  recipientEmail: string;
  inviterName: string;
  organizationName: string;
  role: string;
  invitationLink: string;
  expiryDays: number;
}

interface NotificationEmailRequest {
  recipientEmail: string;
  firstName: string;
  subject: string;
  title: string;
  message: string;
  actionLink?: string;
  actionText?: string;
  notificationType: string;
}

interface BulkEmailRequest {
  recipientEmails: string[];
  subject: string;
  templateName: string;
  placeholders?: Record<string, string>;
}

interface HealthRequest {
  serviceName: string;
}

interface SendEmailResponse {
  success: boolean;
  message_id: string;
  status_message: string;
  queued_at: string;
}

interface BulkEmailResponse {
  success: boolean;
  totalQueued: number;
  totalFailed: number;
  failedEmails: string[];
  statusMessage: string;
}

interface HealthResponse {
  status: number;
  version: string;
  uptime: string;
}

// Server start time for uptime calculation
const serverStartTime = Date.now();

/**
 * Helper to create a success response
 */
const createSuccessResponse = (messageId: string): SendEmailResponse => ({
  success: true,
  message_id: messageId,
  status_message: 'Queued',
  queued_at: new Date().toISOString(),
});

/**
 * Helper to create an error response
 */
const createErrorResponse = (error: string): SendEmailResponse => ({
  success: false,
  message_id: '',
  status_message: `Error: ${error}`,
  queued_at: new Date().toISOString(),
});

/**
 * Generic email sending - allows custom HTML or template-based emails
 */
export const sendEmail = async (
  call: grpc.ServerUnaryCall<SendEmailRequest, SendEmailResponse>,
  callback: GrpcCallback<SendEmailResponse>
): Promise<void> => {
  const request = call.request;
  const messageId = uuidv4();

  try {
    logger.info(
      { messageId, to: request.recipientEmail },
      'gRPC: SendEmail request received'
    );

    await enqueueEmail({
      id: messageId,
      to: request.recipientEmail,
      subject: request.subject,
      template: request.templateName || 'generic',
      data: {
        bodyHtml: request.bodyHtml,
        ...request.placeholders,
      },
    });

    callback(null, createSuccessResponse(messageId));
  } catch (error: any) {
    logger.error({ error, messageId }, 'gRPC: SendEmail failed');
    callback(null, createErrorResponse(error.message));
  }
};

/**
 * Send welcome email to new users after signup
 */
export const sendWelcomeEmail = async (
  call: grpc.ServerUnaryCall<WelcomeEmailRequest, SendEmailResponse>,
  callback: GrpcCallback<SendEmailResponse>
): Promise<void> => {
  const request = call.request;
  const messageId = uuidv4();

  try {
    logger.info(
      { messageId, to: request.recipientEmail },
      'gRPC: SendWelcomeEmail request received'
    );

    await enqueueEmail({
      id: messageId,
      to: request.recipientEmail,
      subject: `Welcome to PropSpaceX, ${request.firstName}!`,
      template: 'welcome',
      data: {
        firstName: request.firstName,
        lastName: request.lastName,
        appRole: request.appRole,
        verificationLink: request.verificationLink,
      },
    });

    callback(null, createSuccessResponse(messageId));
  } catch (error: any) {
    logger.error({ error, messageId }, 'gRPC: SendWelcomeEmail failed');
    callback(null, createErrorResponse(error.message));
  }
};

/**
 * Send email verification email with code/link
 */
export const sendVerificationEmail = async (
  call: grpc.ServerUnaryCall<VerificationEmailRequest, SendEmailResponse>,
  callback: GrpcCallback<SendEmailResponse>
): Promise<void> => {
  const request = call.request;
  const messageId = uuidv4();

  try {
    logger.info(
      { messageId, to: request.recipientEmail },
      'gRPC: SendVerificationEmail request received'
    );

    await enqueueEmail({
      id: messageId,
      to: request.recipientEmail,
      subject: 'Verify Your Email Address',
      template: 'verification',
      data: {
        verificationCode: request.verificationCode,
      },
    });

    callback(null, createSuccessResponse(messageId));
  } catch (error: any) {
    logger.error({ error, messageId }, 'gRPC: SendVerificationEmail failed');
    callback(null, createErrorResponse(error.message));
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  call: grpc.ServerUnaryCall<PasswordResetEmailRequest, SendEmailResponse>,
  callback: GrpcCallback<SendEmailResponse>
): Promise<void> => {
  const request = call.request;
  const messageId = uuidv4();

  try {
    logger.info(
      { messageId, to: request.recipientEmail },
      'gRPC: SendPasswordResetEmail request received'
    );

    await enqueueEmail({
      id: messageId,
      to: request.recipientEmail,
      subject: 'Reset Your Password',
      template: 'password-reset',
      data: {
        firstName: request.firstName,
        resetLink: request.resetLink,
        resetCode: request.resetCode,
        expiryMinutes: request.expiryMinutes,
      },
    });

    callback(null, createSuccessResponse(messageId));
  } catch (error: any) {
    logger.error({ error, messageId }, 'gRPC: SendPasswordResetEmail failed');
    callback(null, createErrorResponse(error.message));
  }
};

/**
 * Send notification when password has been changed
 */
export const sendPasswordChangedEmail = async (
  call: grpc.ServerUnaryCall<PasswordChangedEmailRequest, SendEmailResponse>,
  callback: GrpcCallback<SendEmailResponse>
): Promise<void> => {
  const request = call.request;
  const messageId = uuidv4();

  try {
    logger.info(
      { messageId, to: request.recipientEmail },
      'gRPC: SendPasswordChangedEmail request received'
    );

    await enqueueEmail({
      id: messageId,
      to: request.recipientEmail,
      subject: 'Your Password Has Been Changed',
      template: 'password-changed',
      data: {
        firstName: request.firstName,
        changedAt: request.changedAt,
        ipAddress: request.ipAddress,
        deviceInfo: request.deviceInfo,
        location: request.location,
      },
    });

    callback(null, createSuccessResponse(messageId));
  } catch (error: any) {
    logger.error({ error, messageId }, 'gRPC: SendPasswordChangedEmail failed');
    callback(null, createErrorResponse(error.message));
  }
};

/**
 * Send login alert for security purposes
 */
export const sendLoginAlertEmail = async (
  call: grpc.ServerUnaryCall<LoginAlertEmailRequest, SendEmailResponse>,
  callback: GrpcCallback<SendEmailResponse>
): Promise<void> => {
  const request = call.request;
  const messageId = uuidv4();

  try {
    logger.info(
      { messageId, to: request.recipientEmail },
      'gRPC: SendLoginAlertEmail request received'
    );

    const subject = request.isNewDevice
      ? 'New Device Login Detected'
      : 'New Login to Your Account';

    await enqueueEmail({
      id: messageId,
      to: request.recipientEmail,
      subject,
      template: 'login-alert',
      data: {
        firstName: request.firstName,
        loginTime: request.loginTime,
        ipAddress: request.ipAddress,
        deviceInfo: request.deviceInfo,
        location: request.location,
        isNewDevice: request.isNewDevice,
      },
    });

    callback(null, createSuccessResponse(messageId));
  } catch (error: any) {
    logger.error({ error, messageId }, 'gRPC: SendLoginAlertEmail failed');
    callback(null, createErrorResponse(error.message));
  }
};

/**
 * Send invitation email (team/organization invites)
 */
export const sendInvitationEmail = async (
  call: grpc.ServerUnaryCall<InvitationEmailRequest, SendEmailResponse>,
  callback: GrpcCallback<SendEmailResponse>
): Promise<void> => {
  const request = call.request;
  const messageId = uuidv4();

  try {
    logger.info(
      { messageId, to: request.recipientEmail },
      'gRPC: SendInvitationEmail request received'
    );

    await enqueueEmail({
      id: messageId,
      to: request.recipientEmail,
      subject: `You've been invited to join ${request.organizationName}`,
      template: 'invitation',
      data: {
        inviterName: request.inviterName,
        organizationName: request.organizationName,
        role: request.role,
        invitationLink: request.invitationLink,
        expiryDays: request.expiryDays,
      },
    });

    callback(null, createSuccessResponse(messageId));
  } catch (error: any) {
    logger.error({ error, messageId }, 'gRPC: SendInvitationEmail failed');
    callback(null, createErrorResponse(error.message));
  }
};

/**
 * Send generic notification email
 */
export const sendNotificationEmail = async (
  call: grpc.ServerUnaryCall<NotificationEmailRequest, SendEmailResponse>,
  callback: GrpcCallback<SendEmailResponse>
): Promise<void> => {
  const request = call.request;
  const messageId = uuidv4();

  try {
    logger.info(
      { messageId, to: request.recipientEmail },
      'gRPC: SendNotificationEmail request received'
    );

    await enqueueEmail({
      id: messageId,
      to: request.recipientEmail,
      subject: request.subject,
      template: 'notification',
      data: {
        firstName: request.firstName,
        title: request.title,
        message: request.message,
        actionLink: request.actionLink,
        actionText: request.actionText,
        notificationType: request.notificationType,
      },
    });

    callback(null, createSuccessResponse(messageId));
  } catch (error: any) {
    logger.error({ error, messageId }, 'gRPC: SendNotificationEmail failed');
    callback(null, createErrorResponse(error.message));
  }
};

/**
 * Send bulk emails to multiple recipients
 */
export const sendBulkEmail = async (
  call: grpc.ServerUnaryCall<BulkEmailRequest, BulkEmailResponse>,
  callback: GrpcCallback<BulkEmailResponse>
): Promise<void> => {
  const request = call.request;
  const failedEmails: string[] = [];
  let queuedCount = 0;

  try {
    logger.info(
      { count: request.recipientEmails.length },
      'gRPC: SendBulkEmail request received'
    );

    for (const email of request.recipientEmails) {
      try {
        const messageId = uuidv4();
        await enqueueEmail({
          id: messageId,
          to: email,
          subject: request.subject,
          template: request.templateName,
          data: request.placeholders,
        });
        queuedCount++;
      } catch (error) {
        failedEmails.push(email);
      }
    }

    callback(null, {
      success: failedEmails.length === 0,
      totalQueued: queuedCount,
      totalFailed: failedEmails.length,
      failedEmails: failedEmails,
      statusMessage:
        failedEmails.length === 0
          ? 'All emails queued successfully'
          : `${queuedCount} queued, ${failedEmails.length} failed`,
    });
  } catch (error: any) {
    logger.error({ error }, 'gRPC: SendBulkEmail failed');
    callback(null, {
      success: false,
      totalQueued: 0,
      totalFailed: request.recipientEmails.length,
      failedEmails: request.recipientEmails,
      statusMessage: `Error: ${error.message}`,
    });
  }
};

/**
 * Health check endpoint for service discovery and monitoring
 */
export const checkHealth = async (
  call: grpc.ServerUnaryCall<HealthRequest, HealthResponse>,
  callback: GrpcCallback<HealthResponse>
): Promise<void> => {
  const uptimeMs = Date.now() - serverStartTime;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  callback(null, {
    status: 1, // SERVING
    version: '1.0.0',
    uptime: `${hours}h ${minutes}m ${seconds}s`,
  });
};

/**
 * All gRPC service handlers exported as an object
 */
export const mailServiceHandlers = {
  SendEmail: sendEmail,
  SendWelcomeEmail: sendWelcomeEmail,
  SendVerificationEmail: sendVerificationEmail,
  SendPasswordResetEmail: sendPasswordResetEmail,
  SendPasswordChangedEmail: sendPasswordChangedEmail,
  SendLoginAlertEmail: sendLoginAlertEmail,
  SendInvitationEmail: sendInvitationEmail,
  SendNotificationEmail: sendNotificationEmail,
  SendBulkEmail: sendBulkEmail,
  CheckHealth: checkHealth,
};
