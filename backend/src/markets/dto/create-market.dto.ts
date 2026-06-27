import { IsString, IsOptional } from 'class-validator';

export class CreateMarketDto {
  @IsString({ message: 'Nome é obrigatório' })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString({ message: 'Endereço é obrigatório' })
  address!: string;

  @IsOptional()
  @IsString()
  operatingHours?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}