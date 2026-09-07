import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsString()
  categoryId!: string;

  /** Apenas administradores podem escolher o mercado; para gestores o backend impõe o vínculo. */
  @IsOptional()
  @IsString()
  marketId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  minStock!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stock?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minStock?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateStockDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  minStock!: number;
}
