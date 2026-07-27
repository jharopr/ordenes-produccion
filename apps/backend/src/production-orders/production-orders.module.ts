import { Module } from '@nestjs/common';
import { ProductionOrdersController } from './production-orders.controller';
import { ProductionOrdersService } from './production-orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionOrder } from './production-order.entity';
import { ProductionOrderItem } from './production-order-item.entity';
import { Invoice } from './invoice.entity';
import { PdfModule } from '../pdf/pdf.module';
import { Payment } from './payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionOrder, ProductionOrderItem, Invoice, Payment]), PdfModule],
  controllers: [ProductionOrdersController],
  providers: [ProductionOrdersService],
})
export class ProductionOrdersModule {}
