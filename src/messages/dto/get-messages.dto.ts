import { IsOptional, IsInt, Min, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum MessageFilter {
  ALL = 'all',
  READ = 'read',
  UNREAD = 'unread',
}

export class GetMessagesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @IsOptional()
  @IsEnum(MessageFilter)
  filter?: MessageFilter = MessageFilter.ALL;

  @IsOptional()
  @IsString()
  search?: string;
}
