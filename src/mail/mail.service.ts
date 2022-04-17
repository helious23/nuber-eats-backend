import got from 'got';
import * as FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from '@src/common/common.constants';
import { EmailVar, MailModuleOptions } from '@src/mail/mail.interfaces';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  async sendMail(
    subject: string,
    template: string,
    emailVars: EmailVar[],
    to?: string,
  ): Promise<boolean> {
    const form = new FormData();
    form.append('from', `Max from Nuber Eats <mailgun@${this.options.domain}>`);
    form.append('to', 'max16@naver.com'); // domain 등록 시 to 로 변경
    form.append('subject', subject);
    form.append('template', template);
    emailVars.forEach(emailVar =>
      form.append(`v:${emailVar.key}`, emailVar.value),
    );

    try {
      const response = await got.post(
        `https://api.mailgun.net/v3/${this.options.domain}/messages`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `api:${this.options.apiKey}`,
            ).toString('base64')}`,
          },
          body: form,
        },
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  sendVerificationMail(email: string, code: string) {
    this.sendMail('Nuber Eats 회원 가입을 축하합니다.', 'verify-email', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }
}
