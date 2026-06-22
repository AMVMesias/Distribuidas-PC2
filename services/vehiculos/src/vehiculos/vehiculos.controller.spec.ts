import { Test } from '@nestjs/testing';
import { VehiculosController } from './vehiculos.controller';
import { VehiculosService } from './vehiculos.service';

describe('VehiculosController', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      controllers: [VehiculosController],
      providers: [{ provide: VehiculosService, useValue: {} }],
    }).compile();
    expect(module.get(VehiculosController)).toBeDefined();
  });
});
