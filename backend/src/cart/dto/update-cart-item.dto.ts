import { IsNumber, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(0, { message: 'Quantidade não pode ser negativa' })
  quantity!: number;
}