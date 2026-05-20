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

  @IsString({ message: "Nama harus berupa teks" })
  @MinLength(2, { message: "Nama minimal 2 karakter" })
  name!: string;

  @IsString({ message: "Captcha ID harus berupa teks" })
  captchaId!: string;

  @IsString({ message: "Jawaban captcha harus berupa teks" })
  captchaAnswer!: string;

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
