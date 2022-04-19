import got from 'got';
import * as FormData from 'form-data';
import { MailService } from './mail.service';
import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from '../common/common.constants';

const TEST_DOMAIN = 'testDomain';

jest.mock('got');
jest.mock('form-data');

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            apiKey: 'testApiKey',
            domain: TEST_DOMAIN,
            fromEmail: 'test@from.mail',
          },
        },
      ],
    }).compile();
    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationMail', () => {
    it('should call sendEmail', () => {
      const sendVerificationArgs = {
        email: 'test@email.com',
        code: 'testCode',
      };

      jest.spyOn(service, 'sendMail').mockImplementation(async () => true);

      service.sendVerificationMail(
        sendVerificationArgs.email,
        sendVerificationArgs.code,
      );
      expect(service.sendMail).toHaveBeenCalledTimes(1);
      expect(service.sendMail).toHaveBeenCalledWith(
        'Nuber Eats 회원 가입을 축하합니다.',
        'verify-email',
        [
          { key: 'code', value: sendVerificationArgs.code },
          { key: 'username', value: sendVerificationArgs.email },
        ],
      );
    });
  });

  describe('sendMail', () => {
    it('should send mail', async () => {
      const ok = await service.sendMail('', '', [
        { key: 'key', value: 'value' },
      ]);
      const formSpy = jest.spyOn(FormData.prototype, 'append');

      expect(formSpy).toHaveBeenCalledTimes(5);
      expect(got.post).toHaveBeenCalledTimes(1);
      expect(got.post).toHaveBeenCalledWith(
        `https://api.mailgun.net/v3/${TEST_DOMAIN}/messages`,
        expect.any(Object),
      );
      expect(ok).toEqual(true);
    });
    it('should fail on exception', async () => {
      jest.spyOn(got, 'post').mockImplementation(() => {
        throw new Error();
      });
      const ok = await service.sendMail('', '', [
        { key: 'key', value: 'value' },
      ]);
      expect(ok).toEqual(false);
    });
  });
});
