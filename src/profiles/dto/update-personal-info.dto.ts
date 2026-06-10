import { IsInt, Min, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePersonalInfoDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  professionalTitle?: string | null;

  @IsString()
  @IsOptional()
  bio?: string | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  experience?: number | null;

  @IsString()
  @IsOptional()
  focus?: string | null;

  @IsString()
  @IsOptional()
  languages?: string | null;
}
