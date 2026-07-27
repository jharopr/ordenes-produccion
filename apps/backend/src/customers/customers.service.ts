import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto, CustomerQueryDto, UpdateCustomerDto } from './customers.dto';

@Injectable()
export class CustomersService {
  constructor(@InjectRepository(Customer) private readonly repository: Repository<Customer>) {}

  async create(dto: CreateCustomerDto) {
    if (dto.taxId && await this.repository.exists({ where: { taxId: dto.taxId } })) {
      throw new ConflictException('Ya existe un cliente con este RUC o documento fiscal.');
    }
    return this.repository.save(this.repository.create(dto));
  }

  async findAll(query: CustomerQueryDto) {
    const where = query.search ? [
      { businessName: ILike(`%${query.search}%`) },
      { tradeName: ILike(`%${query.search}%`) },
      { taxId: ILike(`%${query.search}%`) },
    ] : {};
    const [data, total] = await this.repository.findAndCount({
      where, order: { businessName: 'ASC' },
      skip: (query.page - 1) * query.limit, take: query.limit,
    });
    return { data, meta: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) } };
  }

  async findOne(id: string) {
    const customer = await this.repository.findOneBy({ id });
    if (!customer) throw new NotFoundException('Cliente no encontrado.');
    return customer;
  }

  async findDefault() {
    const customer = await this.repository.findOneBy({ isDefault: true });
    if (!customer) throw new NotFoundException('No se ha configurado el cliente predeterminado.');
    return customer;
  }

  async updateLogo(id: string, logoPath: string) {
    const customer = await this.findOne(id);
    customer.logoPath = logoPath;
    return this.repository.save(customer);
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.findOne(id);
    if (dto.taxId && dto.taxId !== customer.taxId &&
        await this.repository.exists({ where: { taxId: dto.taxId } })) {
      throw new ConflictException('Ya existe un cliente con este RUC o documento fiscal.');
    }
    return this.repository.save(this.repository.merge(customer, dto));
  }
}
