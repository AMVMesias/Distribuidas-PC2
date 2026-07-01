import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const received = request.headers['x-internal-service-token'];
    const expected = this.config.get('INTERNAL_SERVICE_TOKEN', 'change-me-internal-token');
    if (received === expected) return true;
    throw new UnauthorizedException('Token interno inválido');
  }
}
