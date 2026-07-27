import { Test, TestingModule } from '@nestjs/testing';
import { ProductionOrdersController } from './production-orders.controller';

describe('ProductionOrdersController', () => {
  let controller: ProductionOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductionOrdersController],
    }).compile();

    controller = module.get<ProductionOrdersController>(ProductionOrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
