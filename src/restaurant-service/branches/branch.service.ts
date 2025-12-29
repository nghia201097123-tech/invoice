import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Branch } from "../../common/entities/branch.entity";

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>
  ) {}

  async findOneByBranchId(branch_id: number): Promise<any> {
    return await this.branchRepository.findOneBy({ id: branch_id });
  }

  async getCityNameByBranchId(branch_id: number): Promise<any> {
    return await this.branchRepository.findOneBy({ id: branch_id });
  }
}
