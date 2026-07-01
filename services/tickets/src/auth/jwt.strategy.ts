import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { readFileSync } from 'node:fs';

interface JwtPayload { sub: string; username: string; roles?: string[] }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: readFileSync(config.get('JWT_PUBLIC_KEY_PATH', '/run/secrets/jwt-public.pem'), 'utf8'),
      algorithms: ['RS256'],
      issuer: config.get('JWT_ISSUER', 'gateway-distribuidas'),
      audience: config.get('JWT_AUDIENCE', 'parking-api'),
    });
  }

  validate(payload: JwtPayload) {
    return { userId: payload.sub, username: payload.username, roles: payload.roles ?? [] };
  }
}
