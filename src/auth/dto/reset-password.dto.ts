import { IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @MinLength(8, {
    message: 'Confirm password must be at least 8 characters long',
  })
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword: string;
}
