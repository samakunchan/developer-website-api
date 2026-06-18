import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  validateSync,
} from 'class-validator';
import { Type, plainToInstance } from 'class-transformer';

export class LexicalNodeDto {
  @IsString()
  type: string;

  @IsNumber()
  version: number;

  @IsString()
  @IsOptional()
  text?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LexicalNodeDto)
  children?: LexicalNodeDto[];

  @IsString()
  @IsOptional()
  direction?: string | null;

  @IsOptional()
  format?: string | number;

  @IsNumber()
  @IsOptional()
  indent?: number;

  @IsNumber()
  @IsOptional()
  detail?: number;

  @IsString()
  @IsOptional()
  mode?: string;

  @IsString()
  @IsOptional()
  style?: string;

  @IsNumber()
  @IsOptional()
  textFormat?: number;

  @IsString()
  @IsOptional()
  textStyle?: string;
}

export class LexicalContentDto {
  @ValidateNested()
  @Type(() => LexicalNodeDto)
  root: LexicalNodeDto;
}

export function IsLexicalJSON(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLexicalJSON',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') {
            return false;
          }
          try {
            const parsed = JSON.parse(value);
            const lexicalContentInstance = plainToInstance(LexicalContentDto, parsed);
            const errors = validateSync(lexicalContentInstance, {
              whitelist: true,
              forbidNonWhitelisted: false,
            });
            return errors.length === 0;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid serialized Lexical JSON string matching the expected schema`;
        },
      },
    });
  };
}

export class UpdateLegalDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsLexicalJSON()
  content: string;
}
