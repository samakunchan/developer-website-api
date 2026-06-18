import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import * as jose from 'jose';
import * as crypto from 'crypto';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

@Injectable()
export class ApiAuthService {
  constructor(private readonly prisma: PrismaService, private readonly emailService: EmailService) {}

  private getJwtSecret(): Uint8Array {
    return new TextEncoder().encode(process.env.SESSION_SECRET || 'a-very-long-and-secure-secret-key-for-development-only');
  }

  private getAppUrl(): string {
    if (process.env.APP_URL_STAGING) {
      return process.env.APP_URL_STAGING;
    }
    if (process.env.APP_URL_PROD) {
      return process.env.APP_URL_PROD;
    }
    return process.env.APP_URL_DEV || process.env.APP_URL || `http://localhost:${process.env.APP_PORT || 3000}`;
  }

  async signIn(data: SignInDto): Promise<{
    token: string;
    user: { id: number; email: string; name: string | null; role: string };
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check for lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const diff = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / (1000 * 60));
      throw new BadRequestException(`Account is temporarily locked. Try again in ${diff} minutes.`);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      const newFailedAttempts: number = user.failedLoginAttempts + 1;
      const isLockingOut: boolean = newFailedAttempts >= MAX_FAILED_ATTEMPTS;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lockoutUntil: isLockingOut ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000) : null,
        },
      });

      if (isLockingOut) {
        throw new BadRequestException(`Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`);
      }

      throw new UnauthorizedException('Invalid email or password');
    }

    const apiSessionId = crypto.randomUUID();

    // Reset failed login attempts on successful sign-in & save currentApiSessionId
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
        currentApiSessionId: apiSessionId,
      },
    });

    // Create stateless JWT token containing apiSessionId
    const token: string = await new jose.SignJWT({
      sub: String(user.id),
      email: user.email,
      role: user.role,
      name: user.name,
      apiSessionId,
    } as any)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(this.getJwtSecret());

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async signOut(userId: number): Promise<{ success: boolean }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentApiSessionId: null,
      },
    });
    return { success: true };
  }

  async verifyToken(token: string): Promise<{
    id: number;
    email: string;
    name: string | null;
    role: string;
  } | null> {
    try {
      const { payload }: { payload: { sub: string; apiSessionId: string } } = await jose.jwtVerify(token, this.getJwtSecret());
      if (!payload || !payload.apiSessionId || !payload.sub) {
        return null;
      }

      const userId: number = parseInt(payload.sub, 10);
      if (isNaN(userId)) {
        return null;
      }

      // Fetch user from DB to ensure they still exist and check currentApiSessionId
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          currentApiSessionId: true,
        },
      });

      if (!user || user.currentApiSessionId !== payload.apiSessionId) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch {
      return null;
    }
  }

  async forgotPassword(data: ForgotPasswordDto): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    // For security, always return success even if user not found
    if (!user) {
      return { success: true };
    }

    const token: string = crypto.randomBytes(32).toString('hex');
    const expiry: Date = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    const resetUrl = `${this.getAppUrl()}/reset-password?token=${token}`;

    await this.emailService.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });

    return { success: true };
  }

  async resetPassword(data: ResetPasswordDto): Promise<{ success: boolean }> {
    if (data.password !== data.confirmPassword) {
      throw new BadRequestException("Passwords don't match");
    }

    const user = await this.prisma.user.findUnique({
      where: { resetToken: data.token },
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        currentSessionId: null, // Invalidate current web sessions
        currentApiSessionId: null, // Invalidate current API sessions
      },
    });

    return { success: true };
  }
}
