import { IsString, IsNumber, Min } from 'class-validator';

export class AddToCartDto {
  @IsString({ message: 'ID do produto é obrigatório' })
  productId!: string;

  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(1, { message: 'Quantidade mínima é 1' })
  quantity!: number;
}