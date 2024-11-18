import { PartialType } from '@nestjs/mapped-types';
import { CreateSkuDto } from './create-sku.dto';

export class updateSkuDto extends PartialType(CreateSkuDto) {}
