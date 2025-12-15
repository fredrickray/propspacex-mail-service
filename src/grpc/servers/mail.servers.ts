import * as grpc from '@grpc/grpc-js';
import { enqueueEmail } from '../../producer';
import logger from '../../logger';
import { v4 as uuidv4 } from 'uuid';

// Type definitions for gRPC handlers
type GrpcCallback<T> = (error: grpc.ServiceError | null, response: T) => void;

interface SendEmailRequest {
  recipient_email: string;
  subject: string;
  body_html?: string;
  template_name?: string;
  placeholders?: Record<string, string>;
}

interface WelcomeEmailRequest {
  recipient_email: string;
  first_name: string;
  last_name: string;
  app_role: string;
  verification_link?: string;
}

interface VerificationEmailRequest {
  recipient_email: string;
  first_name: string;
  verification_code: string;
  verification_link: string;
  expiry_minutes: number;
}

interface PasswordResetEmailRequest {
  recipient_email: string;
  first_name: string;
  reset_link: string;
  reset_code?: string;
  expiry_minutes: number;
}

interface PasswordChangedEmailRequest {
  recipient_email: string;
  first_name: string;
  changed_at: string;
  ip_address: string;
  device_info: string;
  location: string;
}

interface LoginAlertEmailRequest {
  recipient_email: string;
  first_name: string;
  login_time: string;
  ip_address: string;
  device_info: string;
  location: string;
  is_new_device: boolean;
}

interface InvitationEmailRequest {
  recipient_email: string;
  inviter_name: string;
  organization_name: string;
  role: string;
  invitation_link: string;
  expiry_days: number;
}

interface NotificationEmailRequest {
  recipient_email: string;
  first_name: string;
  subject: string;
  title: string;
  message: string;
  action_link?: string;
  action_text?: string;
  notification_type: string;
}

interface BulkEmailRequest {
  recipient_emails: string[];
  subject: string;
  template_name: string;
  placeholders?: Record<string, string>;
}

interface HealthRequest {
  service_name: string;
}

interface SendEmailResponse {
  success: boolean;
  message_id: string;
  status_message: string;
  queued_at: string;
}

interface BulkEmailResponse {
  success: boolean;
  total_queued: number;
  total_failed: number;
  failed_emails: string[];
  status_message: string;
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
      { messageId, to: request.recipient_email },
      'gRPC: SendEmail request received'
    );

    await enqueueEmail({
      id: messageId,
      to: request.recipient_email,
      subject: request.subject,
      template: request.template_name || 'generic',
      data: {
        body_html: request.body_html,
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
      { messageId, to: request.recipient_email },
      'gRPC: SendWelcomeEmail request received'
    );

    await enqueueEmail({
      id: messageId,
      to: request.recipient_email,
      subject: `Welcome to PropSpaceX, ${request.first_name}!`,
      template: 'welcome',
      data: {
        firstName: request.first_name,
        lastName: request.last_name,
        appRole: request.app_role,
        verificationLink: request.verification_link,
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
      { messageId, to: request.recipient_email },
      'gRPC: SendVerificationEmail request received'
    );

    await enqueueEmail({
      id: messageId,
      to: request.recipient_email,
      subject: 'Verify Your Email Address',
      template: 'verification',
      data: {
        firstName: request.first_name,
        verificationCode: request.verification_code,
        verificationLink: request.verification_link,
        expiryMinutes: request.expiry_minutes,
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
      { messageId, to: request.recipient_email },
      'gRPC: SendPasswordResetEmail request received'
    );

    await enqueueEmail({
      id: messageId,
      to: request.recipient_email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      data: {
        firstName: request.first_name,
        resetLink: request.reset_link,
        resetCode: request.reset_code,
        expiryMinutes: request.expiry_minutes,
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
      { messageId, to: request.recipient_email },
      'gRPC: SendPasswordChangedEmail request received'
    );

    await enqueueEmail({
      id: messageId,
      to: request.recipient_email,
      subject: 'Your Password Has Been Changed',
      template: 'password-changed',
      data: {
        firstName: request.first_name,
        changedAt: request.changed_at,
        ipAddress: request.ip_address,
        deviceInfo: request.device_info,
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
      { messageId, to: request.recipient_email },
      'gRPC: SendLoginAlertEmail request received'
    );

    const subject = request.is_new_device
      ? 'New Device Login Detected'
      : 'New Login to Your Account';

    await enqueueEmail({
      id: messageId,
      to: request.recipient_email,
      subject,
      template: 'login-alert',
      data: {
        firstName: request.first_name,
        loginTime: request.login_time,
        ipAddress: request.ip_address,
        deviceInfo: request.device_info,
        location: request.location,
        isNewDevice: request.is_new_device,
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
      { messageId, to: request.recipient_email },
      'gRPC: SendInvitationEmail request received'
    );

    await enqueueEmail({
      id: messageId,
      to: request.recipient_email,
      subject: `You've been invited to join ${request.organization_name}`,
      template: 'invitation',
      data: {
        inviterName: request.inviter_name,
        organizationName: request.organization_name,
        role: request.role,
        invitationLink: request.invitation_link,
        expiryDays: request.expiry_days,
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
      { messageId, to: request.recipient_email },
      'gRPC: SendNotificationEmail request received'
    );

    await enqueueEmail({
      id: messageId,
      to: request.recipient_email,
      subject: request.subject,
      template: 'notification',
      data: {
        firstName: request.first_name,
        title: request.title,
        message: request.message,
        actionLink: request.action_link,
        actionText: request.action_text,
        notificationType: request.notification_type,
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
      { count: request.recipient_emails.length },
      'gRPC: SendBulkEmail request received'
    );

    for (const email of request.recipient_emails) {
      try {
        const messageId = uuidv4();
        await enqueueEmail({
          id: messageId,
          to: email,
          subject: request.subject,
          template: request.template_name,
          data: request.placeholders,
        });
        queuedCount++;
      } catch (error) {
        failedEmails.push(email);
      }
    }

    callback(null, {
      success: failedEmails.length === 0,
      total_queued: queuedCount,
      total_failed: failedEmails.length,
      failed_emails: failedEmails,
      status_message:
        failedEmails.length === 0
          ? 'All emails queued successfully'
          : `${queuedCount} queued, ${failedEmails.length} failed`,
    });
  } catch (error: any) {
    logger.error({ error }, 'gRPC: SendBulkEmail failed');
    callback(null, {
      success: false,
      total_queued: 0,
      total_failed: request.recipient_emails.length,
      failed_emails: request.recipient_emails,
      status_message: `Error: ${error.message}`,
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
