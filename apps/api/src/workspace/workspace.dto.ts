import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsDefined, IsIn, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';

const roles = ['owner', 'branch_manager', 'salesperson', 'warehouse_staff', 'accountant', 'support_agent'];
const dataKeys = [
  'erp.organization', 'erp.company', 'erp.branches', 'erp.warehouses', 'erp.users', 'erp.products', 'erp.variants',
  'erp.customers', 'erp.orders', 'erp.balances', 'erp.ledger', 'erp.transfers', 'erp.notifications', 'erp.audit',
  'erp.modules', 'erp.sequences'
].join('|');

export class WorkspaceDocumentDto {
  @IsString()
  @Matches(new RegExp(`^(?:${dataKeys})$`))
  key!: string;

  @IsDefined()
  data!: unknown;
}

export class SaveDocumentsDto {
  @IsArray()
  @ArrayMaxSize(16)
  @ValidateNested({ each: true })
  @Type(() => WorkspaceDocumentDto)
  entries!: WorkspaceDocumentDto[];
}

export class MemberAccessDto {
  @IsIn(roles)
  role!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  branchId?: string | null;
}

export class MemberStateDto extends MemberAccessDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
