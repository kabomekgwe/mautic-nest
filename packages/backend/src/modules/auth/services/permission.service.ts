import { Injectable } from '@nestjs/common';

@Injectable()
export class PermissionService {
  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    // TODO: Implement RBAC permission checking
    return true;
  }
}
