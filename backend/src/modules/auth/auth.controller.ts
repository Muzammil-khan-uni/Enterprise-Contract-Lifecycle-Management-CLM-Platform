import { Request, Response } from 'express';
import { authService } from './auth.service';
import { userService } from '../users/user.service';
import { auditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';
import { AppError } from '../../core/errors/AppError';
import { env } from '../../config/env';
import { JwtAccessPayload, Permission } from '../users/user.types';

const REFRESH_COOKIE_NAME = 'clm_refresh_token';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password, tenantSlug } = req.body;
    const { accessToken, refreshToken, user } = await authService.login(email, password, tenantSlug);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

    
    
    
    
    auditService
      .record({
        actor: user.id,
        action: AuditAction.LOGIN,
        entityType: 'Auth',
        entityId: user.id,
        ipAddress: req.ip ?? null,
        tenant: user.tenant, 
      })
      .catch(() => {
        
      });

    sendSuccess(res, { accessToken, user });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) throw AppError.unauthorized('No refresh token provided');

    const { accessToken, refreshToken } = await authService.refresh(token);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, { accessToken });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) await authService.logout(token);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
    sendSuccess(res, { loggedOut: true });
  }),

  logoutAllSessions: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    await authService.logoutAllSessions(user.sub);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
    sendSuccess(res, { loggedOutAllSessions: true });
  }),

  

  register: asyncHandler(async (req: Request, res: Response) => {
    const authedUser = (req as Request & { user?: JwtAccessPayload }).user;

    if (authedUser && !authedUser.permissions.includes(Permission.USER_MANAGE)) {
      throw AppError.forbidden('You do not have permission to create users');
    }

    const user = await userService.createUser(
      req.body,
      authedUser ? { tenantId: authedUser.tenant } : undefined
    );

    if (authedUser) {
      
      
      
      sendSuccess(
        res,
        { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
        201
      );
      return;
    }

    
    
    
    
    
    
    
    
    
    const { accessToken, refreshToken, user: loggedInUser } = await authService.login(
      user.email,
      req.body.password,
      req.body.tenantSlug
    );
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
    auditService
      .record({
        actor: loggedInUser.id,
        action: AuditAction.LOGIN,
        entityType: 'Auth',
        entityId: loggedInUser.id,
        ipAddress: req.ip ?? null,
        tenant: loggedInUser.tenant,
      })
      .catch(() => {
        
      });

    sendSuccess(res, { accessToken, user: loggedInUser }, 201);
  }),

  

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email, tenantSlug } = req.body;
    await authService.forgotPassword(email, tenantSlug);
    sendSuccess(res, {
      message: 'If an account with that email exists in this organization, a password reset link has been sent.',
    });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    sendSuccess(res, { message: 'Your password has been reset. Please log in with your new password.' });
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(user.sub, currentPassword, newPassword);
    sendSuccess(res, { message: 'Your password has been changed.' });
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    await authService.verifyEmail(token);
    sendSuccess(res, { message: 'Your email has been verified.' });
  }),

  resendVerification: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    await authService.resendVerificationEmail(user.sub);
    sendSuccess(res, { message: 'Verification email sent.' });
  }),
};
