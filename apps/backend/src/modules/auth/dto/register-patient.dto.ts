import { IsDateString, IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { IsStrongPassword } from "../../../common/validators/strong-password.validator";

export class RegisterPatientDto {
  @IsEmail({}, { message: "Email harus valid" })
  email!: string;

  @IsStrongPassword()
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
