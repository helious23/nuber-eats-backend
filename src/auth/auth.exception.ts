import {
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

export class RoleException extends HttpException {
  constructor() {
    super('Forbidden', HttpStatus.FORBIDDEN);
  }
}

@Catch(RoleException)
export class RoleExceptionFilter implements ExceptionFilter {
  async catch() {
    return {
      ok: false,
      error: '권한이 없습니다',
    };
  }
}
