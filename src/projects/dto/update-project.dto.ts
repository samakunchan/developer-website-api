import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectCategory, ProjectStatus } from '@prisma/client';
import { ProjectImageDto, TechStackItemDto, FeatureItemDto } from './create-project.dto';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProjectImageDto)
  image?: ProjectImageDto | null;

  @IsEnum(ProjectCategory)
  @IsOptional()
  category?: ProjectCategory;

  @IsString()
  @IsOptional()
  categoryLabel?: string;

  @IsString()
  @IsOptional()
  caseStudyNumber?: string | null;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  techIcons?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TechStackItemDto)
  @IsOptional()
  techStack?: TechStackItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureItemDto)
  @IsOptional()
  features?: FeatureItemDto[];

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
}
