import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import juice from 'juice';
import config from './config';
import logger from './logger';
import { EmailOptions, EmailJob } from './types';
import { ServerError } from '@middlewares/error.middleware';

const compileTemplate = (
  templateName: string,
  placeholders?: Record<string, string>
): string => {
  const filePath = path.join(__dirname, '../templates', `${templateName}.html`);
  const templateContent = fs.readFileSync(filePath, 'utf-8');
  const template = Handlebars.compile(templateContent);
  let compiledHtml = template(placeholders);

  compiledHtml = juice(compiledHtml);

  return compiledHtml;
};

const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const user = config.SMTP.user;
    const pass = config.SMTP.password;
    const host = config.SMTP.service;
    const port = parseInt(config.SMTP.port || '587', 10);
    const secure = config.SMTP.secure;

    const transporter = nodemailer.createTransport({
      service: host,
      port: port,
      secure: secure,
      auth: {
        user: user,
        pass: pass,
      },
    });

    const html = compileTemplate(options.templateName, options.placeholders);

    const mailOptions = {
      from: `"${config.company}" <${user}>`,
      to: options.to,
      subject: options.subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ to: options.to, subject: options.subject }, 'Email sent');
    // console.log('Email sent:', info.response);
  } catch (error: any) {
    // console.error('Error sending email:', error.message);
    logger.error({ error }, 'Failed to send email');
    throw new ServerError('Failed to send email', error);
  }
};

export default sendEmail;
