import { Request, Response } from 'express';
import { userRepository } from './user.repository';
import { userService } from './user.service';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';
import { AppError } from '../../core/errors/AppError';
import { JwtAccessPayload } from './user.types';
import { getParam } from '../../core/utils/params';

function toSafeProfile(user: Awaited<ReturnType<typeof userRepository.findById>>) {
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    businessUnit: user.businessUnit,
    department: user.department,
    permissionOverrides: user.permissionOverrides,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
  };
}

export const userController = {
  

  getMe: asyncHandler(async (req: Request, res: Response) => {
    const tokenUser = (req as Request & { user: JwtAccessPayload }).user;
    const user = await userRepository.findById(tokenUser.sub);
    if (!user) throw AppError.notFound('User not found');

    sendSuccess(res, {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      businessUnit: user.businessUnit,
      department: user.department,
      tenant: user.tenant.toString(),
      emailVerified: user.emailVerified,
      permissions: tokenUser.permissions,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    });
  }),

  uploadAvatar: asyncHandler(async (req: Request, res: Response) => {
    const actor = (req as Request & { user: JwtAccessPayload }).user;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) throw AppError.badRequest('No file was uploaded (expected multipart field "file")');

    const updated = await userService.uploadAvatar(actor.sub, file);
    sendSuccess(res, toSafeProfile(updated));
  }),

  deleteAvatar: asyncHandler(async (req: Request, res: Response) => {
    const actor = (req as Request & { user: JwtAccessPayload }).user;
    const updated = await userService.deleteAvatar(actor.sub);
    sendSuccess(res, toSafeProfile(updated));
  }),

  

  list: asyncHandler(async (req: Request, res: Response) => {
    const actor = (req as Request & { user: JwtAccessPayload }).user;
    const users = await userRepository.listByTenant(actor.tenant);
    sendSuccess(res, users.map(toSafeProfile));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const actor = (req as Request & { user: JwtAccessPayload }).user;
    const user = await userRepository.findByIdInTenant(getParam(req, 'id'), actor.tenant);
    if (!user) throw AppError.notFound('User not found');
    sendSuccess(res, toSafeProfile(user));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const actor = (req as Request & { user: JwtAccessPayload }).user;
    const updated = await userService.updateUser(getParam(req, 'id'), actor.tenant, actor.sub, req.body);
    sendSuccess(res, toSafeProfile(updated));
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const actor = (req as Request & { user: JwtAccessPayload }).user;
    const updated = await userService.updateOwnProfile(actor.sub, req.body);
    sendSuccess(res, toSafeProfile(updated));
  }),

  

  directory: asyncHandler(async (req: Request, res: Response) => {
    const actor = (req as Request & { user: JwtAccessPayload }).user;
    const users = await userRepository.listByTenant(actor.tenant);
    sendSuccess(
      res,
      users.filter((u) => u.isActive).map((u) => ({ id: u._id.toString(), name: u.name, email: u.email }))
    );
  }),
};
