export interface OrderBuffetTicket {
  cash_amount: number;
  child_price: number;
  adult_quantity: number;
  adult_price: number;
  bank_amount: number;
  total_adult_amount: number;
  adult_discount_percent: number;
  adult_discount_amount: number;
  total_child_amount: number;
  child_discount_amount: number;
  vat_amount: number;
  child_discount_percent: number;
  transfer_amount: number;
  total_final_amount: number;
  vat_percent: number;
  id: number;
  e_wallet_amount: number;
  child_quantity: number;
  order_id: number;
  buffet_ticket_id: number;
  status: number;
}
