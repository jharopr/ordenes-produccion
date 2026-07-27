import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PdfService } from '../pdf/pdf.service';
import { CreatePaymentDto, CreateProductionOrderDto, ProductionOrderQueryDto, UpdateProductionOrderDto, UpdateProductionOrderStatusDto } from './production-orders.dto';
import { ProductionOrdersService } from './production-orders.service';

@ApiTags('Órdenes de producción')
@Controller('production-orders')
export class ProductionOrdersController {
  constructor(private readonly service: ProductionOrdersService, private readonly pdf: PdfService) {}
  @Get('dashboard') dashboard() { return this.service.dashboard(); }
  @Post() create(@Body() dto: CreateProductionOrderDto) { return this.service.create(dto); }
  @Get() findAll(@Query() query: ProductionOrderQueryDto) { return this.service.findAll(query); }
  @Get(':id/pdf') async download(@Param('id') id: string, @Res() response: Response) {
    const order = await this.service.findOne(id);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${order.orderNumber}.pdf"`,
    });
    this.pdf.createOrderPdf(order).pipe(response);
  }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateProductionOrderDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
  @Patch(':id/status') status(@Param('id') id: string, @Body() dto: UpdateProductionOrderStatusDto) { return this.service.updateStatus(id, dto); }
  @Post(':id/payments') addPayment(@Param('id') id: string, @Body() dto: CreatePaymentDto) { return this.service.addPayment(id, dto); }
}
