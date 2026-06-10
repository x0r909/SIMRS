import { IsOptional, IsString } from "class-validator";

export class RestoreBackupDto {
  @IsOptional()
  @IsString()
  mfaCode?: string;

  @IsOptional()
  @IsString()
  confirmText?: string;
}
