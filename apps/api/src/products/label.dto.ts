import {
  IsBase64,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ParseLabelDto {
  @IsBase64()
  @MaxLength(12 * 1024 * 1024)
  imageBase64!: string;

  @IsOptional()
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  mimeType: string = 'image/jpeg';
}
