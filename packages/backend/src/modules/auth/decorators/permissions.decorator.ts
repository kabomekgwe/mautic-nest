import { SetMetadata } from '@nestjs/common';

export const Permissions = (permission: string) => SetMetadata('permission', permission);
export const Public = () => SetMetadata('isPublic', true);
