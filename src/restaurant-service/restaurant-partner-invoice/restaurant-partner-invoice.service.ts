import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RestaurantPartnerInvoiceEntity } from "../../common/entities/restaurant-partner-invoice.entity";

@Injectable()
export class RestaurantPartnerInvoiceService {
  constructor(
    @InjectRepository(RestaurantPartnerInvoiceEntity)
    private restaurantPartnerInvoiceEntity: Repository<RestaurantPartnerInvoiceEntity>
  ) {}

  /**
   *
   * @param branchId
   * @param invoiceType
   * @returns
   */
  async findOneByBranchIdAndInvoiceType(
    branchId: number,
    invoiceType: number
  ): Promise<RestaurantPartnerInvoiceEntity> {
    let restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity =
      await this.restaurantPartnerInvoiceEntity.findOne({
        where: {
          branch_id: branchId,
          partner_electronic_invoice_type: invoiceType,
        },
      });
    return restaurantPartnerInvoiceEntity;
  }

  async findOneByBranchId(
    branchId: number
  ): Promise<RestaurantPartnerInvoiceEntity> {
    let restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity =
      await this.restaurantPartnerInvoiceEntity.findOne({
        where: {
          branch_id: branchId,
        },
      });
    return restaurantPartnerInvoiceEntity;
  }

  async findOneByRestaurantAndRestaurantBrandAndBranchId(
    restaurantId: number,
    restaurantBrandId: number,
    branchId: number,
    partnerType: number
  ): Promise<RestaurantPartnerInvoiceEntity> {
    let restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity =
      await this.restaurantPartnerInvoiceEntity.findOne({
        where: {
          restaurant_id: restaurantId,
          restaurant_brand_id: restaurantBrandId,
          branch_id: branchId,
          partner_electronic_invoice_type: partnerType,
        },
      });
    return restaurantPartnerInvoiceEntity;
  }

  async findOne(id: number): Promise<any> {
    return await this.restaurantPartnerInvoiceEntity.findOneBy({ id: id });
  }

  async find(): Promise<any> {
    return await this.restaurantPartnerInvoiceEntity.find();
  }

  async findByPartNerType(
    partner_electronic_invoice_type: number
  ): Promise<any> {
    return await this.restaurantPartnerInvoiceEntity.findBy({
      partner_electronic_invoice_type: partner_electronic_invoice_type,
    });
  }
}
