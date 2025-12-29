export class CreateInvoiceDetailsDto {
  tchat: number;
  stt_rec0: number;
  inv_itemCode: string;
  inv_itemName: string;
  inv_unitCode: string;
  inv_quantity: number;
  inv_unitPrice: number;
  inv_discountPercentage: number;
  inv_discountAmount: number;
  inv_TotalAmountWithoutVat: number;
  ma_thue: number;
  inv_vatAmount: number;
  inv_TotalAmount: number;
}
