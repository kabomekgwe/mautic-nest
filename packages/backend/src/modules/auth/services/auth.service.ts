import { Injectable, Logger } from '@nestjs/common';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  async validateToken(token: string): Promise<AuthUser | null> {
    // TODO: Implement JWT/Better Auth validation
    this.logger.debug(`Validating token: ${token.substring(0, 10)}...`);
    return null;
  }
}
