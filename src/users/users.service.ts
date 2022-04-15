import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from '@src/users/dtos/create-account.dto';
import { User } from '@src/users/entities/user.entity';
import { LoginInput, LoginOutput } from '@src/users/dtos/login.dto';
import { JwtService } from '@src/jwt/jwt.service';
import { SeeProfileOutput } from '@src/users/dtos/see-profile.dto';
import {
  EditProfileInput,
  EditProfileOutput,
} from '@src/users/dtos/edit-profile.dto';
import { Verification } from '@src/users/entities/verification.entity';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { MailService } from '../mail/mail.service';
import {
  EditPasswordInput,
  EditPasswordOutput,
} from './dtos/edit-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        return {
          ok: false,
          error: '사용중인 이메일 입니다',
        };
      }
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      const verification = await this.verifications.save(
        this.verifications.create({
          user,
        }),
      );
      this.mailService.sendVerificationMail(user.email, verification.code);
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: '계정을 만들 수 없습니다.',
      };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne(
        { email },
        { select: ['password', 'id'] },
      );
      if (!user) {
        return {
          ok: false,
          error: '사용자를 찾을 수 없습니다',
        };
      }
      const correctPassword = await user.checkPassword(password);
      if (!correctPassword) {
        return {
          ok: false,
          error: '비밀번호가 맞지 않습니다',
        };
      }
      const token = this.jwtService.sign(user.id);
      return {
        ok: true,
        token,
      };
    } catch (error) {
      return {
        ok: false,
        error: '로그인을 할 수 없습니다',
      };
    }
  }

  async findById(id: number): Promise<SeeProfileOutput> {
    try {
      const user = await this.users.findOneOrFail({ id });
      return {
        ok: true,
        user,
      };
    } catch (error) {
      return { ok: false, error: '사용자를 찾을 수 없습니다' };
    }
  }

  async editProfile(
    userId: number,
    { email }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne(
        { id: userId },
        { select: ['id', 'email', 'verified'] },
      );
      if (email === user.email) {
        return {
          ok: false,
          error: '동일한 이메일로는 변경할 수 없습니다',
        };
      }
      const existUser = await this.users.findOne({ where: { email } });
      if (email === existUser.email) {
        return {
          ok: false,
          error: '사용중인 이메일 입니다',
        };
      }
      await this.users.update(user.id, { email, verified: false }); // password hash 가 필요 없으므로 update
      const verification = await this.verifications.findOne({ user });
      if (!verification) {
        // verification 에 user 가 이미 연결 되어 있는 경우는 새로 생성 X mail 만 전송
        const newVerification = await this.verifications.save(
          this.verifications.create({ user }),
        );
        this.mailService.sendVerificationMail(email, newVerification.code);
        return {
          ok: true,
        };
      }
      this.mailService.sendVerificationMail(email, verification.code);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: '프로필을 수정할 수 없습니다',
      };
    }
  }

  async editPassword(
    userId: number,
    { password }: EditPasswordInput,
  ): Promise<EditPasswordOutput> {
    try {
      const user = await this.users.findOne({ id: userId });
      const samePassword = await user.checkPassword(password);
      if (samePassword) {
        return {
          ok: false,
          error: '동일한 비밀번호로는 변경할 수 없습니다',
        };
      }
      user.password = password;
      await this.users.save(user); // password hash 가 필요하므로 save
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: '비밀번호를 변경할 수 없습니다',
      };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne(
        { code },
        { relations: ['user'] },
        // { loadRelationIds: true },
      );
      if (verification) {
        await this.users.update(verification.user.id, { verified: true });
        await this.verifications.delete(verification.id);
        return {
          ok: true,
        };
      }
      return {
        ok: false,
        error: '인증 코드를 확인하세요',
      };
    } catch (error) {
      return {
        ok: false,
        error: '이메일 인증을 하지 못했습니다',
      };
    }
  }
}
