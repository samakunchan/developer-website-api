import { IsEnum, IsString, IsNotEmpty } from 'class-validator';

export enum ServiceEnum {
  WEB = 'web',
  MOBILE = 'mobile',
  MVP = 'mvp',
  AI = 'ai',
  API = 'api',
  OTHER = 'other',
}

export class ServiceTypeDto {
  @IsEnum(ServiceEnum)
  id: ServiceEnum;

  @IsString()
  @IsNotEmpty()
  icon: string;

  @IsString()
  @IsNotEmpty()
  label: string;
}
