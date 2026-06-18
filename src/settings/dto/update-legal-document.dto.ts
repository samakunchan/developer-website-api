import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateLegalDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  content: any;
}
