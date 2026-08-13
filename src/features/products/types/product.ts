export type ProductDto = {
  id: string;
  categoryId: string;
  sku: string;
  name: string;
  barcode: string | null;
  basePrice: number;
  costPrice: number;
  unit: string;
  isConsignment: boolean;
  qtyOnHand: number;
  imageUrl?: string | null;
  isTaxable?: boolean | null;
  isServiceChargeable?: boolean | null;
  hasVariants?: boolean;
  isRawMaterial?: boolean;
  variants?: ProductVariantDto[];
  modifierGroups?: ModifierGroupDto[];
  recipes?: ProductRecipeDto[];
};

export type ProductAttributeValueDto = {
  id: string;
  attributeId: string;
  value: string;
};

export type ProductAttributeDto = {
  id: string;
  name: string;
  values: ProductAttributeValueDto[];
};

export type ProductVariantDto = {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  basePrice: number;
  costPrice: number;
  imageUrl?: string | null;
  isActive: boolean;
  attributeValues: ProductAttributeValueDto[];
};

export type ModifierOptionDto = {
  id: string;
  modifierGroupId: string;
  name: string;
  extraPrice: number;
  extraCost: number;
};

export type ModifierGroupDto = {
  id: string;
  name: string;
  isRequired: boolean;
  minSelection: number;
  maxSelection: number;
  options: ModifierOptionDto[];
};

export type ProductRecipeDto = {
  id: string;
  productVariantId: string;
  rawMaterialProductId: string;
  quantityRequired: number;
};

export type ProductBatchDto = {
  id: string;
  productVariantId: string;
  batchNumber: string;
  expiryDate: string;
  qtyProduction: number;
  qtyRemaining: number;
};

export type ProductRecipeRequest = {
  rawMaterialProductId: string;
  quantityRequired: number;
  productVariantSku?: string | null;
};

export type CreateProductRequest = {
  categoryId: string;
  sku: string;
  name: string;
  barcode: string | null;
  basePrice: number;
  costPrice: number;
  unit: string;
  isConsignment: boolean;
  imageUrl?: string | null;
  isTaxable?: boolean | null;
  isServiceChargeable?: boolean | null;
  hasVariants: boolean;
  isRawMaterial: boolean;
  variants?: Omit<ProductVariantDto, "id" | "productId">[];
  modifierGroups?: Omit<ModifierGroupDto, "id">[];
  recipes?: ProductRecipeRequest[];
};

export type UpdateProductRequest = CreateProductRequest & {
  isActive: boolean;
};

export type ProductFilters = {
  outletId?: string;
  isRawMaterial?: boolean;
};

export type ProductFormValues = {
  categoryId: string;
  sku: string;
  name: string;
  barcode: string;
  basePrice: string;
  costPrice: string;
  unit: string;
  isConsignment: boolean;
  isActive: boolean;
  imageUrl: string;
  isTaxable: "inherit" | "true" | "false";
  isServiceChargeable: "inherit" | "true" | "false";
  hasVariants: boolean;
  isRawMaterial: boolean;
  variants?: any[];
  recipes?: ProductRecipeRequest[];
};

