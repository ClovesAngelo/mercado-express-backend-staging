import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../../test/helpers/prisma-mock';
import { makeUser, makeLoginDto, makeRegisterDto } from '../../test/helpers/auth-test-data';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    jwtService = {
      sign: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user data without password when credentials are valid', async () => {
      const user = makeUser();
      prisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser('test@example.com', 'correct-password');

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('test@example.com');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('correct-password', user.password);
    });

    it('should return null when email does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.validateUser('nonexistent@example.com', 'any-password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const user = makeUser();
      prisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser('test@example.com', 'wrong-password');

      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', user.password);
    });

    it('should rethrow error when prisma fails', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(
        authService.validateUser('test@example.com', 'correct-password'),
      ).rejects.toThrow('DB error');
    });
  });

  describe('login', () => {
    it('should generate JWT token and return user data without password', async () => {
      const user = makeUser({ role: 'CLIENTE' });
      const token = 'generated-jwt-token';
      jwtService.sign.mockReturnValue(token);

      const result = await authService.login(user);

      expect(result.access_token).toBe(token);
      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        marketId: user.marketId,
      });
      expect(result.user).not.toHaveProperty('password');
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
        role: user.role,
        marketId: user.marketId,
      });
    });

    it('should throw UnauthorizedException when JWT sign fails', async () => {
      const user = makeUser();
      jwtService.sign.mockImplementation(() => {
        throw new Error('JWT error');
      });

      await expect(authService.login(user)).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('should hash password, create user and return token', async () => {
      const dto = makeRegisterDto();
      const hashedPassword = '$2b$10$hashed_new_password';
      const createdUser = makeUser({
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: dto.role,
      });
      const token = 'generated-jwt-token';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prisma.user.create.mockResolvedValue(createdUser);
      jwtService.sign.mockReturnValue(token);

      const result = await authService.register(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: dto.email,
          name: dto.name,
          password: hashedPassword,
          role: dto.role,
        },
      });
      expect(result.access_token).toBe(token);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw "Email já cadastrado" when email already exists', async () => {
      const dto = makeRegisterDto();
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hash');
      prisma.user.create.mockRejectedValue({ code: 'P2002' });

      await expect(authService.register(dto)).rejects.toThrow('Email já cadastrado');
    });

    it('should throw generic error on other prisma failures', async () => {
      const dto = makeRegisterDto();
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hash');
      prisma.user.create.mockRejectedValue(new Error('Some other error'));

      await expect(authService.register(dto)).rejects.toThrow('Erro ao criar conta');
    });
  });
});