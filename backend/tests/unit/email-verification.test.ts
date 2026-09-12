jest.mock('../../src/modules/users/user.repository', () => ({
  userRepository: {
    findByEmailVerificationToken: jest.fn(),
    markEmailVerified: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    setEmailVerificationToken: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('../../src/core/email/email.provider', () => ({
  emailProvider: { name: 'console', send: jest.fn().mockResolvedValue(undefined) },
}));

import { userRepository } from '../../src/modules/users/user.repository';
import { emailProvider } from '../../src/core/email/email.provider';
import { authService } from '../../src/modules/auth/auth.service';
import { userService } from '../../src/modules/users/user.service';

describe('authService.verifyEmail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects an invalid or expired token', async () => {
    (userRepository.findByEmailVerificationToken as jest.Mock).mockResolvedValue(null);
    await expect(authService.verifyEmail('bad-token')).rejects.toThrow(/invalid or has expired/i);
  });

  it('marks the matching user verified', async () => {
    (userRepository.findByEmailVerificationToken as jest.Mock).mockResolvedValue({ _id: { toString: () => 'user1' } });
    await authService.verifyEmail('good-token');
    expect(userRepository.markEmailVerified).toHaveBeenCalledWith('user1');
  });
});

describe('authService.resendVerificationEmail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws if the account is already verified, rather than re-sending', async () => {
    (userRepository.findById as jest.Mock).mockResolvedValue({
      _id: { toString: () => 'user1' },
      emailVerified: true,
    });
    await expect(authService.resendVerificationEmail('user1')).rejects.toThrow(/already verified/i);
    expect(emailProvider.send).not.toHaveBeenCalled();
  });

  it('sends a fresh verification email for an unverified account', async () => {
    (userRepository.findById as jest.Mock).mockResolvedValue({
      _id: { toString: () => 'user1' },
      email: 'jane@example.com',
      name: 'Jane',
      emailVerified: false,
    });
    await authService.resendVerificationEmail('user1');
    expect(emailProvider.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'jane@example.com' }));
  });
});

describe('userService.sendVerificationEmail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('stores a hashed token with an expiry and emails the plain token in a link', async () => {
    await userService.sendVerificationEmail({
      _id: { toString: () => 'user1' } as never,
      email: 'jane@example.com',
      name: 'Jane',
    });

    expect(userRepository.setEmailVerificationToken).toHaveBeenCalledWith('user1', expect.any(String), expect.any(Date));
    const [[sentMessage]] = (emailProvider.send as jest.Mock).mock.calls;
    expect(sentMessage.body).toContain('verify-email?token=');
  });
});
