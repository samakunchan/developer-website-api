import { IsEmail, IsNotEmpty } from 'class-validator';

export class SignInDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
