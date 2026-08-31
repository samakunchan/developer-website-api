import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectCategory, ProjectStatus } from '@prisma/client';

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

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ProjectCategory)
  category: ProjectCategory;

  @IsString()
  @IsOptional()
  categoryLabel?: string;

  @IsString()
  @IsOptional()
  caseStudyNumber?: string | null;

  @IsArray()
  @IsString({ each: true })
  techIcons: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TechStackItemDto)
  techStack: TechStackItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureItemDto)
  features: FeatureItemDto[];

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProjectImageDto)
  image?: ProjectImageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProjectUrlDto)
  projectUrl?: ProjectUrlDto;
}
