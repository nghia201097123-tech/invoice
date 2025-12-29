import { SetMetadata } from "@nestjs/common/decorators";

export enum Role {
  OWNER = "OWNER",
  VIEW_ALL = "VIEW_ALL",
  ACCOUNTING_MANAGER = "ACCOUNTING_MANAGER",
  SETTING_MANAGER = "SETTING_MANAGER",
  ACCOUNTANT_ACCESS = "ACCOUNTANT_ACCESS",
}

export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
