import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, JwtPayload } from './auth.service';
import { requireEnvInProduction } from '../../common/config/require-env';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireEnvInProduction('JWT_SECRET') || 'dev-only-jwt-secret',
    });
  }

  /**
   * Validate JWT payload
   * Called after token is verified
   */
  async validate(payload: JwtPayload) {
    const user = await this.authService.getUserById(payload.sub);
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
