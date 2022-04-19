import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});
import { getConnection, Repository } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from '@src/users/entities/verification.entity';

const GRAPHQL_ENDPOINT = '/graphql';

const testUser = {
  email: 'test@test.com',
  password: 'test',
};

const newTestUser = {
  email: 'new@email.com',
  password: 'newPassword',
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  let usersRepository: Repository<User>;
  let verificationRespository: Repository<Verification>;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('X-JWT', jwtToken).send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRespository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  });

  describe('createAccount', () => {
    it('should create an account', () => {
      return publicTest(`
          mutation {
            createAccount(input: { 
              email: "${testUser.email}",
              password: "${testUser.password}", 
              role: Client }
            ) {
              ok
              error
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;
          expect(createAccount.ok).toBeTruthy();
          expect(createAccount.error).toBeNull();
        });
    });
    it('should fail if account already exists', async () => {
      return publicTest(`
          mutation {
            createAccount(input: { 
              email: "${testUser.email}",
              password: "${testUser.password}", 
              role: Client }
            ) {
              ok
              error
            }
          }
        `)
        .expect(200)
        .expect(res => {
          expect(res.body.data.createAccount.ok).toBeFalsy();
          expect(res.body.data.createAccount.error).toBe(
            '사용중인 이메일 입니다',
          );
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      return publicTest(`
          mutation{
            login(input:
              {
                email:"${testUser.email}", 
                password:"${testUser.password}"
              }) {
                ok
                error
                token
              }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBeTruthy();
          expect(login.error).toBeNull();
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });
    it('should not be able to login with wrong credentials', () => {
      return publicTest(`
          mutation{
            login(input:
              {
                email:"${testUser.email}", 
                password:"wrong-password"
              }) {
                ok
                error
                token
              }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBeFalsy();
          expect(login.error).toEqual('비밀번호가 맞지 않습니다');
          expect(login.token).toBe(null);
        });
    });
  });
  describe('seeProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });
    it("should see user's profile", () => {
      return privateTest(`
          {
            seeProfile(userId:${userId}){
              ok
              error
              user{                
                id
              }
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                seeProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;
          expect(ok).toBeTruthy();
          expect(error).toBeNull();
          expect(id).toBe(userId);
        });
    });
    it('should fail to see a profile', () => {
      return privateTest(`
      {
        seeProfile(userId:123){
          ok
          error
          user{                
            id
          }
        }
      }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                seeProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBeFalsy();
          expect(error).toBe('사용자를 찾을 수 없습니다');
        });
    });
  });
  describe('me', () => {
    it('should find my profile', () => {
      return privateTest(`
        {
          me
          {
            email
          }
        }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(testUser.email);
        });
    });
    it('should not allow logged out user', () => {
      return publicTest(`
        {
          me
          {
            email
          }
        }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              errors: [{ message }],
            },
          } = res;
          expect(message).toBe('Forbidden resource');
        });
    });
  });

  describe('editProfile', () => {
    it('should change email', () => {
      return privateTest(`
            mutation {
              editProfile(input: { email: "${newTestUser.email}" }) {
                ok
                error
              }
            }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should have a new eamil', () => {
      return privateTest(`
        {
          me
          {
            email
          }
        }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(newTestUser.email);
        });
    });
  });

  describe('editPassword', () => {
    it('should change password', () => {
      return privateTest(`
        mutation {
              editPassword(input: { password: "${newTestUser.password}" }) {
                ok
                error
              }
            }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                editPassword: { ok, error },
              },
            },
          } = res;
          expect(ok).toBeTruthy();
          expect(error).toBeNull();
        });
    });

    it('should fail if password was same', () => {
      return privateTest(`
        mutation {
              editPassword(input: { password: "${newTestUser.password}" }) {
                ok
                error
              }
            }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                editPassword: { ok, error },
              },
            },
          } = res;
          expect(ok).toBeFalsy();
          expect(error).toBe('동일한 비밀번호로는 변경할 수 없습니다');
        });
    });

    it('should not be able to login with old password', () => {
      return publicTest(`
          mutation{
            login(input:
              {
                email:"${newTestUser.email}",
                password:"${testUser.password}"
              }) {
                ok
                error
                token
              }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBeFalsy();
          expect(login.error).toEqual('비밀번호가 맞지 않습니다');
          expect(login.token).toBe(null);
        });
    });
  });
  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationRespository.find();
      verificationCode = verification.code;
    });
    it('should verify code', () => {
      return publicTest(`
        mutation{
          verifyEmail(input:{code:"${verificationCode}"}){
            ok
            error
          }
        }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBeTruthy();
          expect(error).toBeNull();
        });
    });
    it('should fail on verification', () => {
      return publicTest(`
        mutation{
          verifyEmail(input:{code:"wrong code"}){
            ok
            error
          }
        }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBeFalsy();
          expect(error).toBe('인증 코드를 확인하세요');
        });
    });
  });
});
