import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';

@ApiTags('Ubicaciones')
@Controller('locations')
export class LocationsController {
  constructor(private readonly service: LocationsService) {}
  @Get() findAll() { return this.service.findAll(); }
}
