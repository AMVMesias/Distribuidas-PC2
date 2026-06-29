import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiculosService } from './vehiculos.service';
import { VehiculosController } from './vehiculos.controller';
import { RootVehiculosController } from './root-vehiculos.controller';
import { InternalVehiculosController } from './internal-vehiculos.controller';
import { Vehiculo } from './entities/vehiculo.entity';
import { Auto } from './entities/auto.entity';
import { Motocicleta } from './entities/motocicleta.entity';
import { Camioneta } from './entities/camioneta.entity';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { InternalTokenGuard } from '../auth/internal-token.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo, Auto, Motocicleta, Camioneta]), PassportModule],
  controllers: [VehiculosController, RootVehiculosController, InternalVehiculosController],
  providers: [VehiculosService, JwtStrategy, RolesGuard, InternalTokenGuard],
  exports: [VehiculosService],
})
export class VehiculosModule {}
