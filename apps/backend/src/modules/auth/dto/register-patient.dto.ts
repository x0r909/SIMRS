import { Transform } from "class-transformer";
import { IsDateString, IsEmail, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class RegisterPatientDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/, {
    message: "Password minimal 12 karakter dan harus mengandung huruf besar, huruf kecil, angka, dan simbol"
  })
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
