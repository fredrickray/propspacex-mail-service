export type EmailJob = {
  id?: string;
  to: string;
  subject: string;
  template?: string; // template name
  data?: Record<string, any>;
  retries?: number;
};

export type EmailOptions = {
  id?: string;
  to: string;
  subject: string;
  templateName: string;
  placeholders?: Record<string, any>;
  retries?: number;
};
