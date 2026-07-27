import { PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsInt, IsNumberString, IsOptional, IsString, Length, Matches, Max, Min, ValidateNested } from 'class-validator';
import { ProductionOrderStatus } from './production-order.entity';

const DECIMAL = /^\d+(\.\d{1,2})?$/;

export class CreateProductionOrderItemDto {
  @IsString() @Length(2, 5000) description!: string;
  @IsNumberString() @Matches(/^(?!0+(\.0+)?$)\d+(\.\d{1,2})?$/) quantity!: string;
  @IsNumberString() @Matches(DECIMAL) unitPrice!: string;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
}
export class CreateInvoiceDto {
  @IsOptional() @IsString() @Length(0, 100) invoiceNumber?: string;
  @IsOptional() @Transform(({ value }) => value === '' ? undefined : value)
  @IsDateString() issueDate?: string;
  @IsOptional() @IsNumberString() @Matches(DECIMAL) amount?: string;
}
export class CreatePaymentDto {
  @IsNumberString() @Matches(/^(?!0+(\.0+)?$)\d+(\.\d{1,2})?$/) amount!: string;
  @IsOptional() @IsString() @Length(0, 500) notes?: string;
}
export class CreateProductionOrderDto {
  @IsString() customerId!: string;
  @IsOptional() @Transform(({ value }) => value === '' ? undefined : value)
  @IsString() locationId?: string;
  @IsString() @Length(2, 250) title!: string;
  @IsOptional() @IsString() executionAddress?: string;
  @IsOptional() @Transform(({ value }) => value === '' ? undefined : value)
  @IsDateString() startDate?: string;
  @IsOptional() @Transform(({ value }) => value === '' ? undefined : value)
  @IsDateString() estimatedCompletionDate?: string;
  @IsOptional() @Transform(({ value }) => value === '' ? undefined : value)
  @IsDateString() completionDate?: string;
  @IsOptional() @IsString() @Length(0, 200) requestedBy?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumberString() @Matches(DECIMAL) discount = '0';
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateProductionOrderItemDto)
  items!: CreateProductionOrderItemDto[];
  @IsOptional() @ValidateNested() @Type(() => CreateInvoiceDto) invoice?: CreateInvoiceDto;
  @IsOptional() @ValidateNested() @Type(() => CreatePaymentDto) initialPayment?: CreatePaymentDto;
}
export class UpdateProductionOrderDto extends PartialType(CreateProductionOrderDto) {}
export class UpdateProductionOrderStatusDto {
  @IsEnum(ProductionOrderStatus) status!: ProductionOrderStatus;
}
export class ProductionOrderQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() locationId?: string;
  @IsOptional() @Transform(({ value }) => value === '' ? undefined : value)
  @IsEnum(ProductionOrderStatus) status?: ProductionOrderStatus;
  @IsOptional() @IsDateString() startDateFrom?: string;
  @IsOptional() @IsDateString() startDateTo?: string;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) page = 1;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(100) limit = 10;
}
