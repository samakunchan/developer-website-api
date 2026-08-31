import { UrlMode } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';

export class ImageDetailDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  alt?: string;
}

export class ProjectImageDto {
  @ValidateNested()
  @Type(() => ImageDetailDto)
  medium: ImageDetailDto;

  @ValidateNested()
  @Type(() => ImageDetailDto)
  raw: ImageDetailDto;
}

export class ProjectUrlDto {
  @IsString()
  url: string;

  @IsBoolean()
  isActive: boolean;

  @IsEnum(UrlMode)
  mode: UrlMode;
}

export class TechStackItemDto {
  @IsString()
  name: string;

  @IsString()
  icon: string;
}

export class FeatureItemDto {
  @IsString()
  icon: string;

  @IsString()
  title: string;

  @IsString()
  description: string;
}
