import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import juice from 'juice';
import config from './config';
import logger from './logger';
import { EmailOptions, EmailJob } from './types';
import { ServerError } from '@middlewares/error.middleware';

const templatesDir = path.join(__dirname, '../templates');
const logoPath = path.join(templatesDir, 'logo.jpg');

const registerPartials = (): void => {
  const partialsDir = path.join(templatesDir, 'partials');
  if (!fs.existsSync(partialsDir)) return;

  for (const file of fs.readdirSync(partialsDir)) {
    if (!file.endsWith('.html')) continue;
    const name = path.basename(file, '.html');
    Handlebars.registerPartial(
      name,
      fs.readFileSync(path.join(partialsDir, file), 'utf-8')
    );
  }
};

registerPartials();

const compileTemplate = (
  templateName: string,
  placeholders?: Record<string, any>
): string => {
  const filePath = path.join(templatesDir, `${templateName}.html`);
  const templateContent = fs.readFileSync(filePath, 'utf-8');
  const template = Handlebars.compile(templateContent);
  const compiledHtml = template(placeholders);

  return juice(compiledHtml);
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
      attachments: fs.existsSync(logoPath)
        ? [
            {
              filename: 'logo.jpg',
              path: logoPath,
              cid: 'propspacex-logo',
            },
          ]
        : [],
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
