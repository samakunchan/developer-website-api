import { NotFoundException } from '@nestjs/common';

export class ThemeNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super(
      message ||
        'Theme not found. Must be one of: dark, forest, light, ocean, desert, guardian, aegis',
    );
  }
}
