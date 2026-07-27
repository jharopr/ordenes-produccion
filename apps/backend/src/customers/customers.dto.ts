import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateCustomerDto {
  @IsString() @Length(2, 200) businessName!: string;
  @IsOptional() @IsString() @Length(0, 200) tradeName?: string;
  @IsOptional() @IsString() @Length(0, 20) taxId?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() @Length(0, 100) city?: string;
  @IsOptional() @IsString() @Length(0, 50) phone?: string;
  @IsOptional() @IsEmail() @Length(0, 200) email?: string;
  @IsOptional() @IsString() @Length(0, 200) contactName?: string;
}
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
export class CustomerQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) page = 1;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(100) limit = 10;
}
