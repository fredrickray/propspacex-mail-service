import dotenv from 'dotenv';
dotenv.config();

const config = {
  SMTP: {
    user: process.env.SMTP_USER as string,
    password: process.env.SMTP_PASSWORD as string,
    service: process.env.SMTP_SERVICE as string,
    port: process.env.SMTP_PORT as string,
    secure: process.env.MAIL_SECURE as unknown as boolean,
  },
  rabbitUrl: process.env.RABBIT_URL,
  emailQueue: process.env.EMAIL_QUEUE as string,
  emailDLX: process.env.EMAIL_DLX as string,
  retryAttempts: Number(process.env.EMAIL_RETRY_ATTEMPTS || 5),
  serverPort: process.env.PORT as unknown as number,
  serverEnvironment: process.env.ENV,
  company: process.env.COMPANY_NAME as string,
};

export default config;
