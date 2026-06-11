import { IsString, IsNotEmpty } from 'class-validator';

export class PriceRangeDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  label: string;
}
