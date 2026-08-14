import { BadRequestException } from '@nestjs/common';

export class NoMoreUserAcceptedException extends BadRequestException {
  constructor(message?: string) {
    super(message || 'Registration is disabled because an account already exists');
  }
}
