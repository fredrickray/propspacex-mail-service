/**
 * gRPC Type Definitions for PropSpaceX Mail Service
 *
 * These types match the mail.proto definitions and can be imported
 * by other services for type safety.
 */

// ==================== Request Types ====================

export interface GrpcSendEmailRequest {
  recipient_email: string;
  subject: string;
  body_html?: string;
  template_name?: string;
  placeholders?: Record<string, string>;
}

export interface GrpcWelcomeEmailRequest {
  recipient_email: string;
  first_name: string;
  last_name: string;
  app_role: string;
  verification_link?: string;
}

export interface GrpcVerificationEmailRequest {
  recipient_email: string;
  first_name: string;
  verification_code: string;
  verification_link: string;
  expiry_minutes: number;
}

export interface GrpcPasswordResetEmailRequest {
  recipient_email: string;
  first_name: string;
  reset_link: string;
  reset_code?: string;
  expiry_minutes: number;
}

export interface GrpcPasswordChangedEmailRequest {
  recipient_email: string;
  first_name: string;
  changed_at: string;
  ip_address: string;
  device_info: string;
  location: string;
}

export interface GrpcLoginAlertEmailRequest {
  recipient_email: string;
  first_name: string;
  login_time: string;
  ip_address: string;
  device_info: string;
  location: string;
  is_new_device: boolean;
}

export interface GrpcInvitationEmailRequest {
  recipient_email: string;
  inviter_name: string;
  organization_name: string;
  role: string;
  invitation_link: string;
  expiry_days: number;
}

export interface GrpcNotificationEmailRequest {
  recipient_email: string;
  first_name: string;
  subject: string;
  title: string;
  message: string;
  action_link?: string;
  action_text?: string;
  notification_type: string;
}

export interface GrpcBulkEmailRequest {
  recipient_emails: string[];
  subject: string;
  template_name: string;
  placeholders?: Record<string, string>;
}

export interface GrpcHealthRequest {
  service_name: string;
}

// ==================== Response Types ====================

export interface GrpcSendEmailResponse {
  success: boolean;
  message_id: string;
  status_message: string;
  queued_at: string;
}

export interface GrpcBulkEmailResponse {
  success: boolean;
  total_queued: number;
  total_failed: number;
  failed_emails: string[];
  status_message: string;
}

export enum GrpcHealthStatus {
  UNKNOWN = 0,
  SERVING = 1,
  NOT_SERVING = 2,
}

export interface GrpcHealthResponse {
  status: GrpcHealthStatus;
  version: string;
  uptime: string;
}

// ==================== Service Definition ====================

export interface IMailerService {
  SendEmail: (request: GrpcSendEmailRequest) => Promise<GrpcSendEmailResponse>;
  SendWelcomeEmail: (
    request: GrpcWelcomeEmailRequest
  ) => Promise<GrpcSendEmailResponse>;
  SendVerificationEmail: (
    request: GrpcVerificationEmailRequest
  ) => Promise<GrpcSendEmailResponse>;
  SendPasswordResetEmail: (
    request: GrpcPasswordResetEmailRequest
  ) => Promise<GrpcSendEmailResponse>;
  SendPasswordChangedEmail: (
    request: GrpcPasswordChangedEmailRequest
  ) => Promise<GrpcSendEmailResponse>;
  SendLoginAlertEmail: (
    request: GrpcLoginAlertEmailRequest
  ) => Promise<GrpcSendEmailResponse>;
  SendInvitationEmail: (
    request: GrpcInvitationEmailRequest
  ) => Promise<GrpcSendEmailResponse>;
  SendNotificationEmail: (
    request: GrpcNotificationEmailRequest
  ) => Promise<GrpcSendEmailResponse>;
  SendBulkEmail: (
    request: GrpcBulkEmailRequest
  ) => Promise<GrpcBulkEmailResponse>;
  CheckHealth: (request: GrpcHealthRequest) => Promise<GrpcHealthResponse>;
}
