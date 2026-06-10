import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CategoryStack } from '@prisma/client';

export class CreateTechStackDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(CategoryStack)
  category: CategoryStack;
}
