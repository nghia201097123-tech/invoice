import { Global, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Invoice, InvoiceDocument } from "../../common/schemas/invoice.schema";

@Injectable()
export class InvoiceHelper {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>
  ) {}

  async getListByBranchIdAndInvoiceStatus(
    branch_id: any,
    status: any
  ): Promise<Invoice[]> {
    let listInvoices: Invoice[] = [];
    listInvoices = await this.invoiceModel.find({
      branch_id: branch_id,
      invoice_status: status,
    });
    return listInvoices;
  }

  async getListByBranchIdAndInvoiceStatusAndCcduyet(
    branch_id: any,
    status: any,
    cct_duyet: number
  ): Promise<Invoice[]> {
    let listInvoices: Invoice[] = [];
    listInvoices = await this.invoiceModel.find({
      branch_id: branch_id,
      invoice_status: status,
      cct_duyet: cct_duyet,
    });
    return listInvoices;
  }

  public async getListByBranchId(branch_id: any): Promise<Invoice[]> {
    let listInvoices: Invoice[] = [];
    listInvoices = await this.invoiceModel.find({ branch_id: branch_id });
    return listInvoices;
  }

  public async findByInvoiceStatusAndBranchId(
    branch_id: any,
    invoice_status: any
  ): Promise<Invoice[]> {
    let listInvoices: Invoice[] = [];
    listInvoices = await this.invoiceModel.find({
      branch_id: branch_id,
      invoice_status: invoice_status,
    });
    return listInvoices;
  }

  public async findAll() {
    return this.invoiceModel.find();
  }

  public async findById(id: string): Promise<Invoice> {
    return this.invoiceModel.findById(id);
  }

  public async findByBranchId(branch_id: number) {
    return this.invoiceModel.find({ branch_id: branch_id });
  }

  public async findByBranchIdAndPartnerTypeAndCctDuyet(
    branch_id: number,
    partnerType: number
  ) {
    return this.invoiceModel.find({
      branch_id: branch_id,
      partner_type: partnerType,
      cct_duyet: 0,
      invoice_status: 1,
    });
  }

  public async findByRestaurantIdAndRestaurantBrandAndBranchId(
    restaurantId: number,
    brandId: number,
    branchId: number
  ) {
    return this.invoiceModel.find({
      restaurant_id: restaurantId,
      restaurant_brand_id: brandId,
      branch_id: branchId,
    });
  }

  public async findByRestaurantIdAndRestaurantBrandAndBranchIdAndPartnerType(
    restaurantId: number,
    brandId: number,
    branchId: number,
    partnerType: number
  ) {
    return this.invoiceModel.find({
      restaurant_id: restaurantId,
      restaurant_brand_id: brandId,
      branch_id: branchId,
      partner_type: partnerType,
      invoice_status: 1,
    });
  }

  public async findByRestaurantIdAndRestaurantBrandAndBranchIdAndStatus(
    restaurantId: number,
    brandId: number,
    branchId: number,
    status: number
  ) {
    return this.invoiceModel.find({
      restaurant_id: restaurantId,
      restaurant_brand_id: brandId,
      branch_id: branchId,
      invoice_status: status,
      cct_duyet: 0,
    });
  }

  public async findByRestaurantIdAndRestaurantBrandAndBranchIdAndStatusWithLimit(
    restaurantId: number,
    brandId: number,
    branchId: number,
    status: number,
    limit: number,
    excludeIds?: string[],
    fromDate?: Date,
    toDate?: Date
  ) {
    const query: any = {
      restaurant_id: restaurantId,
      restaurant_brand_id: brandId,
      branch_id: branchId,
      invoice_status: status,
      cct_duyet: 0,
    };

    // Exclude processed invoice IDs if provided
    if (excludeIds && excludeIds.length > 0) {
      query._id = { $nin: excludeIds };
    }

    // Lọc theo khoảng thời gian tạo hóa đơn
    if (fromDate && toDate) {
      query.createdAt = {
        $gte: fromDate,
        $lt: toDate,
      };
    } else if (fromDate) {
      query.createdAt = { $gte: fromDate };
    } else if (toDate) {
      query.createdAt = { $lt: toDate };
    }
    return this.invoiceModel.find(query).limit(limit);
  }

  public async findByIdAndUpdateInvoiceStatusAndRefcode(
    id: string,
    { invoice_status, ref_code }
  ) {
    return this.invoiceModel.findByIdAndUpdate(id, {
      invoice_status,
      ref_code,
    });
  }

  public async updateDiscountInvoice(
    invoice: Invoice,
    { total_discount_amount, total_vat_amount },
    isAppFood: boolean,
    {
      totalQuantity,
      totalDiscountAmount,
      totalAmountWithoutVat,
      totalVatAmount,
      totalAmount,
      totalPrice,
    },
    isDisCountAll: boolean,
    isApplyRevertVatRestaurant: boolean,
    allItemsHaveVat: boolean = true
  ) {
    if (isAppFood) {
      invoice.amount = invoice.total_amount - invoice.vat_amount;
      invoice.total_amount_without_vat = invoice.total_amount;
      invoice.total_amount =
        invoice.total_amount_without_vat - total_discount_amount;
    } else {
      if (!isDisCountAll) {
        // Trường hợp KHÔNG có giảm giá tổng bill
        if (isApplyRevertVatRestaurant) {
          // **RESTAURANT ORDERS không có giảm giá tổng bill - LOGIC MỚI**
          // LUÔN giữ nguyên invoice.total_amount làm gốc, tính ngược các giá trị khác

          // Tính VAT cho extra charge amount nếu có
          if (invoice.total_amount_extra_charge_amount > 0) {
            const extraChargeVatAmount =
              (invoice.total_amount_extra_charge_amount * 8) / 100;
            invoice.total_amount =
              invoice.total_amount_extra_charge_amount + invoice.total_amount;
            invoice.vat_amount = totalVatAmount + extraChargeVatAmount;
            invoice.total_amount_without_vat =
              invoice.total_amount -
              invoice.total_amount_extra_charge_amount -
              invoice.vat_amount;
            invoice.amount = invoice.total_amount_without_vat;
            invoice.discount_amount = totalDiscountAmount;
          } else {
            invoice.vat_amount = totalVatAmount;
            invoice.discount_amount = totalDiscountAmount;
            invoice.total_amount_discount_amount = totalDiscountAmount;
            invoice.amount =
              invoice.total_amount -
              invoice.vat_amount -
              invoice.total_amount_extra_charge_amount +
              invoice.discount_amount;
            invoice.total_amount_without_vat = invoice.amount;
          }

          console.log(
            `Restaurant order without total discount - Keeping original total_amount: ${invoice.total_amount}, Calculated amount: ${invoice.amount}, VAT: ${invoice.vat_amount}, Discount: ${invoice.discount_amount}`
          );
        } else {
          // **LOGIC CŨ cho App Food và các trường hợp khác**
          // Tính VAT cho extra charge amount nếu có
          let extraChargeVatAmount = 0;
          if (invoice.total_amount_extra_charge_amount > 0) {
            // Chỉ tính VAT cho extra charge nếu tất cả item đều có VAT
            if (allItemsHaveVat) {
              extraChargeVatAmount =
                (invoice.total_amount_extra_charge_amount *
                  (invoice.vat || 8)) /
                100;
            }
          }

          if (invoice.vat_amount > 0 && totalDiscountAmount > 0) {
            // Trường hợp có cả VAT và discount
            invoice.total_amount_without_vat = totalAmountWithoutVat;
            invoice.total_amount_discount_amount = totalDiscountAmount;
            invoice.amount =
              totalAmountWithoutVat - invoice.total_amount_extra_charge_amount;
            invoice.vat_amount = totalVatAmount + extraChargeVatAmount;
            invoice.total_amount =
              invoice.amount +
              invoice.vat_amount -
              totalDiscountAmount +
              invoice.total_amount_extra_charge_amount;

            // Nếu có phụ thu thì cộng thêm total_amount_extra_charge_amount (bất kể có VAT hay không)
            if (invoice.total_amount_extra_charge_amount > 0) {
              invoice.amount += invoice.total_amount_extra_charge_amount;
              invoice.total_amount += invoice.total_amount_extra_charge_amount;
            }

            invoice.discount_amount = totalDiscountAmount;
          } else if (invoice.vat_amount > 0) {
            // Trường hợp chỉ có VAT, không có discount
            invoice.vat_amount = totalVatAmount + extraChargeVatAmount;
            invoice.amount =
              totalAmount -
              totalDiscountAmount -
              invoice.total_amount_extra_charge_amount;
            invoice.total_amount =
              totalAmount -
              totalDiscountAmount +
              invoice.vat_amount +
              invoice.total_amount_extra_charge_amount;

            // Nếu có phụ thu thì cộng thêm total_amount_extra_charge_amount (bất kể có VAT hay không)
            if (invoice.total_amount_extra_charge_amount > 0) {
              invoice.amount += invoice.total_amount_extra_charge_amount;
              invoice.total_amount += invoice.total_amount_extra_charge_amount;
            }

            invoice.total_amount_without_vat = totalAmount - invoice.vat_amount;
            invoice.discount_amount = totalDiscountAmount;
          } else {
            // Trường hợp không có VAT
            invoice.vat_amount = extraChargeVatAmount;
            invoice.amount =
              totalAmount +
              totalDiscountAmount -
              invoice.total_amount_extra_charge_amount;
            invoice.total_amount_without_vat =
              totalAmount + totalDiscountAmount;
            invoice.total_amount =
              invoice.amount -
              totalDiscountAmount +
              invoice.total_amount_extra_charge_amount;

            // Nếu có phụ thu thì cộng thêm total_amount_extra_charge_amount (bất kể có VAT hay không)
            if (invoice.total_amount_extra_charge_amount > 0) {
              invoice.amount += invoice.total_amount_extra_charge_amount;
              invoice.total_amount += invoice.total_amount_extra_charge_amount;
            }

            invoice.total_amount_discount_amount = totalDiscountAmount;
            invoice.discount_amount = totalDiscountAmount;
          }
        }
      } else {
        // Trường hợp có giảm giá tổng bill (isDisCountAll = true)

        // Tính VAT cho extra charge amount nếu có
        let extraChargeVatAmount = 0;
        if (invoice.total_amount_extra_charge_amount > 0) {
          // Chỉ tính VAT cho extra charge nếu tất cả item đều có VAT
          if (allItemsHaveVat) {
            extraChargeVatAmount =
              (invoice.total_amount_extra_charge_amount * (invoice.vat || 8)) /
              100;
          }
        }

        if (isApplyRevertVatRestaurant) {
          // **RESTAURANT ORDERS với giảm giá tổng bill - LOGIC MỚI**
          // GIỮ NGUYÊN invoice.total_amount và invoice.total_amount_discount_amount
          // Tính ngược các giá trị khác từ total_amount

          invoice.vat_amount = totalVatAmount + extraChargeVatAmount;

          // Tính amount từ total_amount (giữ nguyên total_amount làm gốc)
          // total_amount = amount + vat_amount + extra_charge_amount - total_amount_discount_amount
          // => amount = total_amount - vat_amount - extra_charge_amount + total_amount_discount_amount
          invoice.amount =
            invoice.total_amount -
            invoice.vat_amount -
            invoice.total_amount_extra_charge_amount +
            invoice.total_amount_discount_amount;
          invoice.total_amount_without_vat = invoice.amount;

          // Nếu có phụ thu thì cộng thêm total_amount_extra_charge_amount (bất kể có VAT hay không)
          if (invoice.total_amount_extra_charge_amount > 0) {
            invoice.amount += invoice.total_amount_extra_charge_amount;
            invoice.total_amount += invoice.total_amount_extra_charge_amount;
          }

          // invoice.total_amount_discount_amount GIỮ NGUYÊN - đã có sẵn
        } else {
          // **LOGIC CŨ - giữ nguyên cho App Food và các trường hợp khác**
          invoice.vat_amount = totalVatAmount + extraChargeVatAmount;
          invoice.total_amount = isApplyRevertVatRestaurant
            ? invoice.amount +
              invoice.total_amount_discount_amount +
              invoice.vat_amount
            : invoice.amount -
              invoice.total_amount_discount_amount +
              invoice.vat_amount;

          // Nếu có phụ thu thì cộng thêm total_amount_extra_charge_amount (bất kể có VAT hay không)
          if (invoice.total_amount_extra_charge_amount > 0) {
            invoice.amount += invoice.total_amount_extra_charge_amount;
            invoice.total_amount += invoice.total_amount_extra_charge_amount;
          }
        }
      }
    }

    return this.invoiceModel.findByIdAndUpdate(invoice._id, invoice);
  }

  public async findByIdAndUpdateInvoiceStatusAndRefCodeAndExportTime(
    id: string,
    { invoice_status, ref_code, exported_time }
  ) {
    return this.invoiceModel.findByIdAndUpdate(id, {
      invoice_status,
      ref_code,
      exported_time,
    });
  }

  public async findByIdAndUpdateDiscount(
    id: string,
    {
      total_amount,
      amount,
      vat_amount,
      discount_amount,
      food_discount_amount,
      drink_discount_amount,
      total_amount_discount_amount,
      total_amount_extra_charge_amount,
    }
  ) {
    return this.invoiceModel.findByIdAndUpdate(id, {
      total_amount,
      amount,
      vat_amount,
      discount_amount,
      food_discount_amount,
      drink_discount_amount,
      total_amount_discount_amount,
      total_amount_extra_charge_amount,
    });
  }

  public async find(ref_code: string) {
    return this.invoiceModel.find({ ref_code: ref_code });
  }

  public async findByIdAndUpdateCct(id: string) {
    return await this.invoiceModel
      .findByIdAndUpdate(id, { cct_duyet: 1 })
      .exec();
  }

  public async findByIdAndUpdateCctWhenCctCancel(id: string) {
    return this.invoiceModel.findByIdAndUpdate(id, {
      cct_duyet: 0,
      invoice_status: 3,
    });
  }

  public async findOneByOrderId(orderId: number): Promise<Invoice> {
    return await this.invoiceModel
      .findOne({
        order_id: orderId,
      })
      .exec();
  }

  public async findOneByOrderParentId(orderParentId: number): Promise<Invoice> {
    return await this.invoiceModel
      .findOne({
        order_parent_id: orderParentId,
      })
      .exec();
  }

  public async findOneByOrderIdAndUpdate(orderId: number): Promise<Invoice> {
    return await this.invoiceModel
      .findOne({
        order_id: orderId,
      })
      .exec();
  }

  public async findByListId(ids: string[] | any): Promise<Invoice[]> {
    return await this.invoiceModel
      .find({
        _id: { $in: ids },
      })
      .exec();
  }

  public async findOneByIdAndUpdateRefCode(
    id: string,
    fkey: string
  ): Promise<Invoice> {
    return await this.invoiceModel
      .findByIdAndUpdate(id, { ref_code: fkey })
      .exec();
  }

  public async findOneByRefCodeAndUpdate(ref_code: string): Promise<Invoice> {
    return await this.invoiceModel
      .findOneAndUpdate({ ref_code: ref_code }, { cct_duyet: 1 })
      .exec();
  }

  public async findOneByRefCodeAndUpdateMirage(
    ref_code: string
  ): Promise<Invoice> {
    return await this.invoiceModel
      .findOneAndUpdate({ ref_code: ref_code }, { cct_duyet: 0 })
      .exec();
  }

  public async findByIdAndDelete(_id: string): Promise<Invoice> {
    return await this.invoiceModel.findByIdAndRemove(_id, {}).exec();
  }

  public async findByPartNerTypeAndStatus(
    partnerType: number,
    invoice_status: number[]
  ): Promise<Invoice[]> {
    return this.invoiceModel.find({
      partner_type: partnerType,
      invoice_status: { $in: invoice_status },
    });
  }

  public async findByIdAndUpdate(
    id: string,
    newId: string,
    orderId: number
  ): Promise<Invoice> {
    return await this.invoiceModel
      .findByIdAndUpdate(id, {
        _id: newId,
        order_id: orderId,
      })
      .exec();
  }

  public async findByIdAndUpdateInvoiceStatusAndRefcodeAndOrderIdAndExportedTime(
    id: string,
    { invoice_status, ref_code, order_id, exported_time }
  ) {
    return this.invoiceModel.findByIdAndUpdate(id, {
      invoice_status,
      ref_code,
      order_id,
      exported_time,
    });
  }

  async findByIdAndUpdateDiscountV2(
    id: string,
    total_amount: number,
    amount: number,
    vat_amount: number,
    discount_amount: number
  ) {
    return this.invoiceModel.findByIdAndUpdate(id, {
      total_amount: total_amount,
      amount: amount,
      vat_amount: vat_amount,
      discount_amount: discount_amount,
    });
  }

  async findByIdAndUpdateInvoice(
    id: string,
    customer_name: string,
    customer_phone: string,
    customer_company_name: string,
    customer_company_tax_code: string,
    customer_company_address: string,
    customer_company_email: string,
    customer_bank_account: string,
    customer_bank_account_name: string,
    ref_code: string,
    exported_time: string,
    invoice_status: number,
    voice_series: string,
    partner_type: number,
    is_send_mail: number
  ) {
    return this.invoiceModel.findByIdAndUpdate(id, {
      customer_name,
      customer_phone,
      customer_company_name,
      customer_company_tax_code,
      customer_company_address,
      customer_company_email,
      customer_bank_account,
      customer_bank_account_name,
      ref_code,
      exported_time,
      invoice_status,
      voice_series,
      partner_type,
      is_send_mail,
    });
  }

  public async findByIdAndUpdateExportTime(id: string, exported_time: string) {
    return this.invoiceModel.findByIdAndUpdate(id, {
      exported_time,
    });
  }

  public async findByIdAndUpdateBase(invoice: Invoice) {
    return this.invoiceModel.findByIdAndUpdate(invoice._id, invoice);
  }

  public async findByIdAndUpdateInvoiceHaveFkey(
    id: string,
    customer_name: string,
    customer_phone: string,
    customer_company_name: string,
    customer_company_tax_code: string,
    customer_company_address: string,
    customer_company_email: string,
    customer_bank_account: string,
    customer_bank_account_name: string,
    ref_code: string,
    order_id: string,
    order_parent_id: string,
    exported_time: string,
    invoice_status: number,
    voice_series: string,
    partner_type: number
  ) {
    return this.invoiceModel.findByIdAndUpdate(id, {
      customer_name,
      customer_phone,
      customer_company_name,
      customer_company_tax_code,
      customer_company_address,
      customer_company_email,
      customer_bank_account,
      customer_bank_account_name,
      ref_code,
      order_id,
      order_parent_id,
      exported_time,
      invoice_status,
      voice_series,
      partner_type,
    });
  }
}
