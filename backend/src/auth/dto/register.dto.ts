import { IsEmail, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @IsString({ message: 'Nome é obrigatório' })
  name!: string;

  @IsString({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password!: string;

  @IsOptional()
  @IsString()
  role?: string;
}