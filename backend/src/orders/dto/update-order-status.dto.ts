import { IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString({ message: 'Status é obrigatório' })
  status!: string;
}