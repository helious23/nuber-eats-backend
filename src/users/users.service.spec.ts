import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './users.service';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from '../jwt/jwt.service';
import { MailService } from '../mail/mail.service';
import { Repository } from 'typeorm';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneOrFail: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = {
  sign: jest.fn().mockImplementation(() => 'signed-token'),
  verify: jest.fn(),
};

const mockMailService = () => ({
  sendMail: jest.fn(),
  sendVerificationMail: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UserService;
  let usersRepository: MockRepository<User>;
  let verificationRepository: MockRepository<Verification>;
  let mailService: MailService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService(),
        },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
    usersRepository = module.get(getRepositoryToken(User));
    verificationRepository = module.get(getRepositoryToken(Verification));
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: 'test@email.com',
      password: 'test',
      role: 0,
    };

    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'jest@mock.com',
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: '사용중인 이메일 입니다',
      });
    });

    it('should create a new user', async () => {
      // mock return or resolved value
      usersRepository.findOne.mockResolvedValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArgs);
      usersRepository.save.mockResolvedValue(createAccountArgs);

      verificationRepository.create.mockReturnValue({
        user: createAccountArgs,
      });
      verificationRepository.save.mockResolvedValue({
        code: 'test-code',
      });

      // call the method
      const result = await service.createAccount(createAccountArgs);

      // users.create
      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);

      // users.save
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);

      // verifications.create
      expect(verificationRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      // verification.save
      expect(verificationRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationRepository.save).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      // mailService.sendVerificationMail
      expect(mailService.sendVerificationMail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationMail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );

      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      // mock rejected value : make error
      usersRepository.findOne.mockRejectedValue(new Error());

      // call the method
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({
        ok: false,
        error: '계정을 만들 수 없습니다.',
      });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'test@email.com',
      password: 'test',
    };

    it("should fail if user doesn't exist", async () => {
      // mocking resolved value of findOne
      usersRepository.findOne.mockResolvedValue(null);

      // call the method
      const result = await service.login(loginArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(result).toEqual({
        ok: false,
        error: '사용자를 찾을 수 없습니다',
      });
    });

    it("should fail if password doesn't correct", async () => {
      // user entitiy 의 checkPassword method 를 mocking
      // jest.fn().mockImplementation('mocking result')
      // or jest.fn(() => 'mocking result')
      const mockedUser = {
        checkPassword: jest
          .fn()
          .mockImplementation(() => Promise.resolve(false)),
      };

      // mocking resolved value of findOne
      usersRepository.findOne.mockResolvedValue(mockedUser);

      // call the method
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: '비밀번호가 맞지 않습니다' });
    });

    it('should return token when password correct', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest
          .fn()
          .mockImplementation(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);

      const result = await service.login(loginArgs);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));

      expect(result).toEqual({ ok: true, token: 'signed-token' });
    });
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: '로그인을 할 수 없습니다',
      });
    });
  });

  describe('findById', () => {
    const findByIdArgs = { id: 1 };
    it('should find user', async () => {
      usersRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(1);
      expect(result).toEqual({ ok: true, user: findByIdArgs });
    });

    it('should fail to find user', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(1);
      expect(result).toEqual({ ok: false, error: '사용자를 찾을 수 없습니다' });
    });
  });

  describe('editProfile', () => {
    const oldUser = {
      id: 1,
      verified: true,
      email: 'old@email.com',
    };
    const editProfileArgs = {
      userId: 1,
      input: { email: 'new@email.com', verified: false },
    };
    const newUser = {
      email: editProfileArgs.input.email,
      verified: false,
    };
    const existUser = {
      email: 'exist@email.com',
    };
    const newVerification = {
      code: 'newCode',
    };
    it("should fail if user doesn't exist", async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.editProfile(1, oldUser);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(result).toEqual({
        ok: false,
        error: '프로필을 수정할 수 없습니다',
      });
    });

    it('should fail if email is same', async () => {
      usersRepository.findOne.mockResolvedValueOnce(oldUser);
      const result = await service.editProfile(1, oldUser);
      expect(result).toEqual({
        ok: false,
        error: '동일한 이메일로는 변경할 수 없습니다',
      });
    });

    it('should fail if email is used', async () => {
      usersRepository.findOne.mockResolvedValueOnce(oldUser);
      usersRepository.findOne.mockResolvedValueOnce(existUser);
      const result = await service.editProfile(1, existUser);
      expect(result).toEqual({
        ok: false,
        error: '사용중인 이메일 입니다',
      });
    });

    it('should change email with old verification code', async () => {
      // mocking
      usersRepository.findOne.mockResolvedValueOnce(oldUser);
      usersRepository.findOne.mockResolvedValueOnce(existUser);
      usersRepository.update.mockResolvedValue(editProfileArgs);
      verificationRepository.findOne.mockResolvedValue(null);
      verificationRepository.create.mockReturnValue(newVerification);
      verificationRepository.save.mockResolvedValue(newVerification);

      // call the method
      const result = await service.editProfile(editProfileArgs.userId, newUser);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(2);
      expect(usersRepository.findOne).toHaveBeenNthCalledWith(
        1,
        { id: 1 },
        expect.any(Object),
      );
      expect(usersRepository.findOne).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
      );
      expect(usersRepository.update).toHaveBeenCalledTimes(1);
      expect(usersRepository.update).toHaveBeenCalledWith(oldUser.id, newUser);

      expect(verificationRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationRepository.create).toHaveBeenCalledWith({
        user: oldUser,
      });

      expect(verificationRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationRepository.save).toHaveBeenCalledWith(newVerification);

      expect(mailService.sendVerificationMail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationMail).toHaveBeenCalledWith(
        newUser.email,
        newVerification.code,
      );

      expect(result).toEqual({ ok: true });
    });

    it('should change email with new verification code', async () => {
      // mocking
      usersRepository.findOne.mockResolvedValueOnce(oldUser);
      usersRepository.findOne.mockResolvedValueOnce(existUser);
      usersRepository.update.mockResolvedValue(editProfileArgs);
      verificationRepository.findOne.mockResolvedValue(newVerification);

      // call the method
      const result = await service.editProfile(editProfileArgs.userId, newUser);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(2);
      expect(usersRepository.findOne).toHaveBeenNthCalledWith(
        1,
        { id: 1 },
        expect.any(Object),
      );
      expect(usersRepository.findOne).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
      );
      expect(usersRepository.update).toHaveBeenCalledTimes(1);
      expect(usersRepository.update).toHaveBeenCalledWith(oldUser.id, newUser);

      expect(mailService.sendVerificationMail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationMail).toHaveBeenCalledWith(
        newUser.email,
        newVerification.code,
      );

      expect(result).toEqual({ ok: true });
    });
  });

  describe('editPassword', () => {
    it('should fail if password is same', async () => {
      const oldUser = {
        id: 1,
        password: 'oldPassword',
        checkPassword: jest
          .fn()
          .mockImplementation(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(oldUser);
      const result = await service.editPassword(1, oldUser);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({ id: oldUser.id });

      expect(result).toEqual({
        ok: false,
        error: '동일한 비밀번호로는 변경할 수 없습니다',
      });
    });

    it('should change password', async () => {
      const oldUser = {
        id: 1,
        password: 'oldPassword',
        checkPassword: jest
          .fn()
          .mockImplementation(() => Promise.resolve(false)),
      };
      const newUser = {
        password: 'newPassword',
      };
      usersRepository.findOne.mockResolvedValue(oldUser);
      usersRepository.save.mockResolvedValue(newUser);

      const result = await service.editPassword(1, newUser);

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(expect.any(Object));

      expect(result).toEqual({ ok: true });
    });

    it('should be fail to change password', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.editPassword(1, {});
      expect(result).toEqual({
        ok: false,
        error: '비밀번호를 변경할 수 없습니다',
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const mockedVerification = {
        user: {
          id: 1,
        },
        id: 1,
      };
      verificationRepository.findOne.mockResolvedValue(mockedVerification);

      const result = await service.verifyEmail('');

      expect(verificationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );

      expect(usersRepository.update).toHaveBeenCalledTimes(1);
      expect(usersRepository.update).toHaveBeenCalledWith(
        mockedVerification.user.id,
        { verified: true },
      );

      expect(verificationRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationRepository.delete).toHaveBeenCalledWith(
        mockedVerification.id,
      );
      expect(result).toEqual({ ok: true });
    });

    it('should be fail if verification code is wrong', async () => {
      verificationRepository.findOne.mockResolvedValue(undefined);
      const result = await service.verifyEmail('');
      expect(result).toEqual({
        ok: false,
        error: '인증 코드를 확인하세요',
      });
    });

    it('should be fail on error', async () => {
      verificationRepository.findOne.mockRejectedValue(new Error());
      const result = await service.verifyEmail('');
      expect(result).toEqual({
        ok: false,
        error: '이메일 인증을 하지 못했습니다',
      });
    });
  });
});
