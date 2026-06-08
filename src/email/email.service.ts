import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private async getTransporter() {
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      // For development, use Ethereal Email
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    // For production, use real SMTP settings
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail({ to, subject, html, text }: SendEmailParams) {
    const transporter = await this.getTransporter();
    const from = process.env.EMAIL_FROM || '"Secure Papanguesoft" <contact@samakunchan-technology.com>';

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      html,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('---------------------------------------');
      console.log('📧 Email sent (Ethereal)');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      console.log('---------------------------------------');
    }

    return info;
  }
}
