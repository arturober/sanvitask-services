import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // canActivate de AuthGuard ('jwt') se encarga de la lógica de extracción y validación del token.
    return super.canActivate(context);
  }

  handleRequest(err: any, user, info: any, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // if (isPublic) {
    //   // Si la ruta es pública, devolvemos el usuario si existe (token válido), o null si no.
    //   // No lanzamos error para que la petición continúe.
    //   return (user as User) || null;
    // }

    // Si la ruta no es pública, y no hay usuario (o hay un error), lanzamos UnauthorizedException.
    if (err || (!isPublic && !user)) {
      throw err || new UnauthorizedException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
