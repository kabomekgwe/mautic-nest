import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { PermissionService } from './services/permission.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionGuard } from './guards/permission.guard';

@Module({
  providers: [AuthService, PermissionService, JwtAuthGuard, PermissionGuard],
  exports: [AuthService, PermissionService, JwtAuthGuard, PermissionGuard],
})
export class AuthModule {}
