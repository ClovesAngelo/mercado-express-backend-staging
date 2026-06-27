import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../../test/helpers/prisma-mock';

describe('UsersService', () => {
  let usersService: UsersService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'CLIENTE',
    createdAt: new Date(),
  };

  describe('create', () => {
    it('should create a user', async () => {
      const createDto = {
        email: 'new@example.com',
        name: 'New User',
        password: 'hashed-password',
        role: 'CLIENTE',
      };

      prisma.user.create.mockResolvedValue(mockUser);

      const result = await usersService.create(createDto);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await usersService.findAll();

      expect(result).toEqual([mockUser]);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await usersService.findOne('user-1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
    });

    it('should return null when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await usersService.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });
});