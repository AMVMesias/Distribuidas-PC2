import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(err: unknown, user: TUser, info: unknown, context: ExecutionContext): TUser {
    if (err || !user) {
      throw new UnauthorizedException(this.message(info, context));
    }
    return user;
  }

  private message(info: unknown, context: ExecutionContext): string {
    const authorization = context.switchToHttp().getRequest<{ headers?: Record<string, string | undefined> }>().headers?.authorization;
    if (!authorization) {
      return 'Access token ausente. Inicia sesion y envia Authorization: Bearer <accessToken>';
    }

    const details = info as { name?: string; message?: string } | undefined;
    if (details?.name === 'TokenExpiredError') {
      return 'Access token expirado. Vuelve a iniciar sesion o usa el refresh token para obtener uno nuevo';
    }
    if (details?.name === 'JsonWebTokenError' && details.message?.includes('invalid signature')) {
      return 'Access token invalido: la firma no coincide. Copia solo el accessToken, sin comillas, sin refreshToken y sin texto extra';
    }
    return 'Access token invalido. Copia solo el accessToken y verifica que no este vencido';
  }
}
