import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AuthStrategy } from '../../auth/interfaces/auth.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class CustomAuthGuard extends AuthGuard(AuthStrategy.API_KEY) {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    );

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
