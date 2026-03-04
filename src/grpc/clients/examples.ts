/**
 * Example: Using the Mail Service gRPC Client in User Service
 *
 * This file demonstrates how to integrate the mail service client
 * in other microservices like the user service.
 *
 * TO USE IN YOUR SERVICE:
 * 1. Copy the files from src/grpc/clients/ and src/grpc/proto/ to your service
 * 2. Or install as a shared package if you have a monorepo
 * 3. Set MAIL_SERVICE_GRPC_URL environment variable
 */

import { MailServiceClient, getMailClient } from '../clients/mail.client';

// ==================== Configuration ====================
// Set this in your .env file:
// MAIL_SERVICE_GRPC_URL=mail-service:50051 (for Docker)
// MAIL_SERVICE_GRPC_URL=localhost:50051 (for local dev)

// ==================== Example User Service Integration ====================

/**
 * Example signup function with mail service integration
 */
async function exampleSignup(
  payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    appRole: string;
  },
  ipAddress?: string,
  userAgent?: string,
  location?: string
) {
  // ... your existing signup logic ...

  // After creating the user, send welcome email via gRPC
  const mailClient = getMailClient();

  try {
    const response = await mailClient.sendWelcomeEmail({
      recipientEmail: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      appRole: payload.appRole,
      verificationLink: `https://app.propspacex.com/verify?email=${payload.email}`,
    });

    console.log('Welcome email queued:', response.messageId);
  } catch (error) {
    // Don't fail signup if email fails - just log it
    console.error('Failed to send welcome email:', error);
  }

  // return newUser;
}

/**
 * Example password reset request
 */
async function exampleRequestPasswordReset(email: string, firstName: string) {
  const mailClient = getMailClient();
  const resetToken = 'generated-reset-token'; // Generate your token

  const response = await mailClient.sendPasswordResetEmail({
    recipientEmail: email,
    firstName: firstName,
    resetLink: `https://app.propspacex.com/reset-password?token=${resetToken}`,
    // resetCode: '123456', // Optional OTP
    // expiryMinutes: 30,
  });

  return response;
}

/**
 * Example login with security alert
 */
async function exampleLoginWithAlert(
  user: { email: string; firstName: string },
  loginInfo: {
    ipAddress: string;
    deviceInfo: string;
    location: string;
    isNewDevice: boolean;
  }
) {
  const mailClient = getMailClient();

  // Send login alert for new devices or suspicious activity
  if (loginInfo.isNewDevice) {
    await mailClient.sendLoginAlertEmail({
      recipientEmail: user.email,
      firstName: user.firstName,
      loginTime: new Date().toISOString(),
      ipAddress: loginInfo.ipAddress,
      deviceInfo: loginInfo.deviceInfo,
      location: loginInfo.location,
      isNewDevice: loginInfo.isNewDevice,
    });
  }
}

/**
 * Example email verification
 */
async function exampleSendVerificationEmail(
  email: string,
  firstName: string,
  verificationCode: string
) {
  const mailClient = getMailClient();

  const response = await mailClient.sendVerificationEmail({
    recipientEmail: email,
    // firstName: firstName,
    verificationCode: verificationCode,
    // verificationLink: `https://app.propspacex.com/verify?code=${verificationCode}`,
    // expiryMinutes: 15,
  });

  return response;
}

/**
 * Example password changed notification
 */
async function exampleNotifyPasswordChanged(
  user: { email: string; firstName: string },
  securityInfo: {
    ipAddress: string;
    deviceInfo: string;
    location: string;
  }
) {
  const mailClient = getMailClient();

  await mailClient.sendPasswordChangedEmail({
    recipientEmail: user.email,
    firstName: user.firstName,
    changedAt: new Date().toISOString(),
    ipAddress: securityInfo.ipAddress,
    deviceInfo: securityInfo.deviceInfo,
    location: securityInfo.location,
  });
}

/**
 * Example team invitation
 */
async function exampleSendTeamInvitation(
  inviterName: string,
  inviteeEmail: string,
  organizationName: string,
  role: string
) {
  const mailClient = getMailClient();
  const inviteToken = 'generated-invite-token';

  const response = await mailClient.sendInvitationEmail({
    recipientEmail: inviteeEmail,
    inviterName: inviterName,
    organizationName: organizationName,
    role: role,
    invitationLink: `https://app.propspacex.com/invite?token=${inviteToken}`,
    expiryDays: 7,
  });

  return response;
}

/**
 * Example health check (useful for service mesh / monitoring)
 */
async function exampleHealthCheck() {
  const mailClient = getMailClient();

  try {
    const health = await mailClient.checkHealth('user-service');
    console.log('Mail service status:', health.status);
    console.log('Mail service version:', health.version);
    console.log('Mail service uptime:', health.uptime);
    return health.status === 'SERVING';
  } catch (error) {
    console.error('Mail service health check failed:', error);
    return false;
  }
}

// ==================== Advanced: Using with Retry Logic ====================

class MailServiceWrapper {
  private client: MailServiceClient;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(address?: string) {
    this.client = new MailServiceClient(
      address || process.env.MAIL_SERVICE_GRPC_URL || 'localhost:50051'
    );
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.warn(`Mail service attempt ${attempt} failed:`, error.message);

        if (attempt < this.maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * attempt)
          );
        }
      }
    }

    throw lastError;
  }

  async sendWelcomeEmailWithRetry(
    params: Parameters<MailServiceClient['sendWelcomeEmail']>[0]
  ) {
    return this.withRetry(() => this.client.sendWelcomeEmail(params));
  }

  // Add more wrapper methods as needed...
}

export {
  exampleSignup,
  exampleRequestPasswordReset,
  exampleLoginWithAlert,
  exampleSendVerificationEmail,
  exampleNotifyPasswordChanged,
  exampleSendTeamInvitation,
  exampleHealthCheck,
  MailServiceWrapper,
};
