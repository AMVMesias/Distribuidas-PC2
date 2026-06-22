import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VehiculosService } from './vehiculos.service';
import { Vehiculo } from './entities/vehiculo.entity';

describe('VehiculosService', () => {
  const repository = { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), remove: jest.fn() };

  it('filters the list by owner for USER', async () => {
    repository.find.mockResolvedValue([]);
    const module = await Test.createTestingModule({
      providers: [VehiculosService, { provide: getRepositoryToken(Vehiculo), useValue: repository }],
    }).compile();
    const service = module.get(VehiculosService);
    await service.findAll({ userId: '84e9cae7-3068-49f2-adbd-b87d8bc2eb87', username: 'user', roles: ['USER'] });
    expect(repository.find).toHaveBeenCalledWith({
      where: { ownerId: '84e9cae7-3068-49f2-adbd-b87d8bc2eb87' },
    });
  });
});
