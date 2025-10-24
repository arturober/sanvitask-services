import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { AuthUser } from './decorators/user.decorator';
import { LoginTokenDto } from './dto/login-token.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterResponse } from './interfaces/register-response';
import { TokenResponse } from './interfaces/token-response';
import { User } from 'src/users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  async register(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    userDto: RegisterUserDto,
  ): Promise<RegisterResponse> {
    try {
      return await this.authService.registerUser(userDto);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  @Post('login')
  @Public()
  async login(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    userDto: LoginUserDto,
  ): Promise<TokenResponse> {
    try {
      return await this.authService.login(userDto);
    } catch {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        error: 'Email or password incorrect',
      });
    }
  }

  @Post('google')
  @Public()
  async loginGoogle(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    tokenDto: LoginTokenDto,
  ): Promise<TokenResponse> {
    try {
      return await this.authService.loginGoogle(tokenDto);
    } catch (e) {
      console.log(e);
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        error: 'Google login failed',
      });
    }
  }

  @Post('facebook')
  @Public()
  async loginFacebook(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    tokenDto: LoginTokenDto,
  ): Promise<TokenResponse> {
    try {
      return await this.authService.loginFacebook(tokenDto);
    } catch {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        error: 'Facebook login failed',
      });
    }
  }

  @Get('validate')
  @HttpCode(204)
  validate(): void {
    // Valida el token
  }

  @Get('logout')
  @HttpCode(204)
  async logout(@AuthUser() authUser: User) {
    await this.authService.logout(authUser);
  }
}
