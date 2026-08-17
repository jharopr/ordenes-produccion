import { BadRequestException, ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { CreatePaymentDto, CreateProductionOrderDto, ProductionOrderQueryDto, UpdateProductionOrderDto, UpdateProductionOrderStatusDto } from './production-orders.dto';
import { Invoice } from './invoice.entity';
import { Payment } from './payment.entity';
import { ProductionOrderItem } from './production-order-item.entity';
import { PaymentStatus, ProductionOrder, ProductionOrderStatus } from './production-order.entity';

function scaled(value: string): bigint {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * 100n + BigInt((fraction + '00').slice(0, 2));
}
function money(value: bigint): string {
  return `${value / 100n}.${(value % 100n).toString().padStart(2, '0')}`;
}
type CalculableItem = { quantity: string; unitPrice: string };
function itemSubtotal(item: CalculableItem): bigint {
  return scaled(item.quantity) * scaled(item.unitPrice) / 100n;
}
function resolvePaymentStatus(paid: bigint, total: bigint): PaymentStatus {
  if (paid <= 0n) return PaymentStatus.UNPAID;
  if (paid >= total) return PaymentStatus.PAID;
  return PaymentStatus.PARTIALLY_PAID;
}

@Injectable()
export class ProductionOrdersService {
  constructor(
    @InjectRepository(ProductionOrder) private readonly repository: Repository<ProductionOrder>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateProductionOrderDto) {
    this.validateDates(dto.startDate, dto.estimatedCompletionDate, dto.completionDate);
    return this.dataSource.transaction(async (manager) => {
      if (!await manager.exists('customers', { where: { id: dto.customerId } })) throw new NotFoundException('Cliente no encontrado.');
      if (dto.locationId && !await manager.exists('locations', { where: { id: dto.locationId } })) throw new NotFoundException('Ubicación no encontrada.');
      const [{ nextval }] = await manager.query<{ nextval: string }[]>(`SELECT nextval('production_order_number_seq')`);
      const orderNumber = `OP-${new Date().getFullYear()}-${nextval.padStart(6, '0')}`;
      const totals = this.calculate(dto.items, dto.discount);
      const initialPaid = dto.initialPayment ? scaled(dto.initialPayment.amount) : 0n;
      if (initialPaid > totals.total) {
        throw new BadRequestException('El pago inicial no puede superar el total de la orden.');
      }
      const order = manager.create(ProductionOrder, {
        ...dto, orderNumber, locationId: dto.locationId ?? null,
        paymentStatus: resolvePaymentStatus(initialPaid, totals.total),
        discount: money(totals.discount), subtotal: money(totals.subtotal), total: money(totals.total),
        items: dto.items.map((item, index) => manager.create(ProductionOrderItem, {
          ...item, displayOrder: item.displayOrder ?? index,
          subtotal: money(itemSubtotal(item)),
        })),
        invoices: dto.invoice ? [manager.create(Invoice, {
          invoiceNumber: dto.invoice.invoiceNumber ?? null,
          issueDate: dto.invoice.issueDate ?? null,
          amount: dto.invoice.amount ?? null,
        })] : [],
      });
      const saved = await manager.save(order);
      if (dto.initialPayment) {
        await manager.save(manager.create(Payment, {
          productionOrderId: saved.id,
          amount: money(initialPaid),
          notes: dto.initialPayment.notes ?? null,
        }));
      }
      return manager.findOneOrFail(ProductionOrder, {
        where: { id: saved.id },
        relations: { customer: true, location: true, items: true, invoices: true, payments: true },
      });
    });
  }

  async findAll(query: ProductionOrderQueryDto) {
    const qb = this.repository.createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.location', 'location')
      .orderBy('order.createdAt', 'DESC');
    if (query.search) qb.andWhere(new Brackets((w) => w
      .where('order.orderNumber ILIKE :search', { search: `%${query.search}%` })
      .orWhere('order.title ILIKE :search', { search: `%${query.search}%` })
      .orWhere('customer.businessName ILIKE :search', { search: `%${query.search}%` })));
    if (query.customerId) qb.andWhere('order.customerId = :customerId', { customerId: query.customerId });
    if (query.locationId) qb.andWhere('order.locationId = :locationId', { locationId: query.locationId });
    if (query.status) qb.andWhere('order.status = :status', { status: query.status });
    if (query.startDateFrom) qb.andWhere('order.startDate >= :from', { from: query.startDateFrom });
    if (query.startDateTo) qb.andWhere('order.startDate <= :to', { to: query.startDateTo });
    const total = await qb.getCount();
    const data = await qb.skip((query.page - 1) * query.limit).take(query.limit).getMany();
    return { data, meta: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) } };
  }

  async findOne(id: string) {
    const order = await this.repository.findOne({
      where: { id }, relations: { customer: true, location: true, items: true, invoices: true, payments: true },
      order: { items: { displayOrder: 'ASC' } },
    });
    if (!order) throw new NotFoundException('Orden de producción no encontrada.');
    return order;
  }

  async update(id: string, dto: UpdateProductionOrderDto) {
    const existing = await this.findOne(id);
    if (existing.status === ProductionOrderStatus.CANCELLED) throw new ConflictException('No se puede modificar una orden cancelada.');
    const merged = { ...existing, ...dto };
    this.validateDates(merged.startDate ?? undefined, merged.estimatedCompletionDate ?? undefined, merged.completionDate ?? undefined);
    const items = dto.items ?? existing.items.map((x) => ({
      description: x.description, quantity: x.quantity, unitPrice: x.unitPrice,
      displayOrder: x.displayOrder,
    }));
    const discount = dto.discount ?? existing.discount;
    return this.dataSource.transaction(async (manager) => {
      const totals = this.calculate(items, discount);
      const [{ paid }] = await manager.query<{ paid: string }[]>(
        `SELECT COALESCE(SUM(amount), 0)::text AS paid FROM payments WHERE production_order_id = $1`,
        [id],
      );
      const paidAmount = scaled(paid);
      if (paidAmount > totals.total) {
        throw new BadRequestException('El nuevo total no puede ser menor que los pagos registrados.');
      }
      await manager.delete(ProductionOrderItem, { productionOrderId: id });
      if (dto.invoice !== undefined) {
        await manager.delete(Invoice, { productionOrderId: id });
      }
      manager.merge(ProductionOrder, existing, {
        ...dto, subtotal: money(totals.subtotal), discount: money(totals.discount), total: money(totals.total),
        paymentStatus: resolvePaymentStatus(paidAmount, totals.total),
        ...(dto.invoice !== undefined ? {
          invoices: dto.invoice ? [manager.create(Invoice, {
            invoiceNumber: dto.invoice.invoiceNumber ?? null,
            issueDate: dto.invoice.issueDate ?? null,
            amount: dto.invoice.amount ?? null,
          })] : [],
        } : {}),
      });
      existing.items = items.map((item, index) => manager.create(ProductionOrderItem, {
        ...item, displayOrder: item.displayOrder ?? index,
        subtotal: money(itemSubtotal(item)),
      }));
      return manager.save(existing);
    });
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    if (order.status !== ProductionOrderStatus.DRAFT) throw new ConflictException('Solo se pueden eliminar órdenes en borrador.');
    await this.repository.remove(order);
    return { message: 'Orden eliminada correctamente.' };
  }

  async updateStatus(id: string, dto: UpdateProductionOrderStatusDto) {
    const order = await this.findOne(id);
    const allowed: Record<ProductionOrderStatus, ProductionOrderStatus[]> = {
      DRAFT: [ProductionOrderStatus.ORDERED, ProductionOrderStatus.CANCELLED],
      ORDERED: [ProductionOrderStatus.CANCELLED],
      CANCELLED: [],
    };
    if (!allowed[order.status].includes(dto.status)) throw new UnprocessableEntityException('La transición de estado no es válida.');
    order.status = dto.status;
    return this.repository.save(order);
  }

  async addPayment(id: string, dto: CreatePaymentDto) {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(ProductionOrder, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('Orden de producción no encontrada.');
      if (order.status === ProductionOrderStatus.CANCELLED) {
        throw new ConflictException('No se pueden registrar pagos en una orden cancelada.');
      }
      const [{ paid }] = await manager.query<{ paid: string }[]>(
        `SELECT COALESCE(SUM(amount), 0)::text AS paid FROM payments WHERE production_order_id = $1`,
        [id],
      );
      const amount = scaled(dto.amount);
      const accumulated = scaled(paid) + amount;
      const total = scaled(order.total);
      if (accumulated > total) throw new BadRequestException('El pago supera el saldo pendiente de la orden.');
      await manager.save(manager.create(Payment, {
        productionOrderId: id,
        amount: money(amount),
        notes: dto.notes ?? null,
      }));
      order.paymentStatus = resolvePaymentStatus(accumulated, total);
      await manager.save(order);
    });
    return this.findOne(id);
  }

  async dashboard() {
    const rows = await this.repository.createQueryBuilder('o')
      .select('o.status', 'status').addSelect('COUNT(*)', 'count').addSelect('COALESCE(SUM(o.total), 0)', 'total')
      .groupBy('o.status').getRawMany<{ status: ProductionOrderStatus; count: string; total: string }>();
    const recent = await this.repository.find({ relations: { customer: true }, order: { createdAt: 'DESC' }, take: 5 });
    return { totalOrders: rows.reduce((a, r) => a + Number(r.count), 0), totalAmount: rows.reduce((a, r) => a + Number(r.total), 0), byStatus: Object.fromEntries(rows.map((r) => [r.status, Number(r.count)])), recent };
  }

  private calculate(items: CalculableItem[], discountValue = '0') {
    const subtotal = items.reduce((sum, item) => sum + itemSubtotal(item), 0n);
    const discount = scaled(discountValue);
    if (discount > subtotal) throw new BadRequestException('El descuento no puede superar el subtotal.');
    return { subtotal, discount, total: subtotal - discount };
  }
  private validateDates(start?: string, estimated?: string, completed?: string) {
    if (start && estimated && estimated < start) throw new BadRequestException('La fecha estimada no puede ser anterior a la fecha de inicio.');
    if (start && completed && completed < start) throw new BadRequestException('La fecha de terminación no puede ser anterior a la fecha de inicio.');
  }
}
