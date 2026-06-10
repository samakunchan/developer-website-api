import { IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { SocialLinkType } from '@prisma/client';

export class CreateSocialLinkDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  url: string;

  @IsString()
  @IsNotEmpty()
  icon: string;

  @IsEnum(SocialLinkType)
  type: SocialLinkType;
}
