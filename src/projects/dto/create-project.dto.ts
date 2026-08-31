import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectCategory, ProjectStatus } from '@prisma/client';
import { TechStackItemDto, FeatureItemDto, ProjectImageDto, ProjectUrlDto } from './generale.dto';

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
