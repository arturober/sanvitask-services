import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthConfig, GOOGLE_ID, JWT_KEY } from './interfaces/providers';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { IsUserAlreadyExistConstraint } from './validators/user-exists.validator';
import { User } from 'src/users/entities/user.entity';
import { UserModule } from 'src/users/user.module';
import { CommonsModule } from 'src/commons/commons.module';

@Module({})
export class AuthModule {
  static forRoot(config: AuthConfig): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        MikroOrmModule.forFeature([User]),
        UserModule,
        CommonsModule,
        PassportModule,
        JwtModule.register({
          secret: 'YTRnNk05TC4sLeG4iSorYXNkZg==',
          signOptions: { expiresIn: '365d' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        IsUserAlreadyExistConstraint,
        AuthService,
        JwtStrategy,
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
        {
          provide: JWT_KEY,
          useValue: 'YTRnNk05TC4sLeG4iSorYXNkZg==',
        },
        {
          provide: GOOGLE_ID,
          useValue: config.googleId,
        },
      ],
    };
  }
}
