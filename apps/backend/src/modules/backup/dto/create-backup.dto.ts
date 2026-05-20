import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBackupDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  description?: string;
}
