import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './location.entity';

@Injectable()
export class LocationsService {
  constructor(@InjectRepository(Location) private readonly repository: Repository<Location>) {}
  findAll() { return this.repository.find({ where: { isActive: true }, order: { name: 'ASC' } }); }
}
