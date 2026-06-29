import { Controller, Delete, ForbiddenException, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VehiculosService } from './vehiculos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthenticatedRequest } from '../auth/auth-user';

@ApiTags('root-vehiculos')
@ApiBearerAuth('bearerAuth')
@Controller('api/v1/root/vehiculos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RootVehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Delete(':id')
  @ApiOperation({ summary: '[ROOT] Eliminar vehículo físicamente' })
  @ApiResponse({ status: 200, description: 'Vehículo eliminado físicamente' })
  @ApiResponse({ status: 403, description: 'Se requiere rol ROOT' })
  @ApiResponse({ status: 404, description: 'No existe' })
  async physicalDelete(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) {
    if (!req.user.roles.includes('ROOT')) {
      throw new ForbiddenException('Se requiere rol ROOT');
    }
    // Use admin-like user to bypass owner check
    const adminUser = { ...req.user, roles: ['ADMIN', ...req.user.roles] };
    const vehiculo = await this.vehiculosService.remove(id, adminUser);
    return { message: 'Vehículo eliminado físicamente', vehiculo };
  }
}
