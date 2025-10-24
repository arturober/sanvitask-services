import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from 'src/users/entities/user.entity';
import { UserService } from 'src/users/user.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    @Inject('JWT_KEY') jwtKey: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtKey,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    try {
      const user = await this.userService.getUser(payload.id);
      return user;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
