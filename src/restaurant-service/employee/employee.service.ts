import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Employee } from "../../common/entities/employee.entity";
import { ExceptionStoreProcedure } from "src/common/utils/utils.exception.common/utils.store-procedure-exception.common";

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>
  ) {}

  async findOne(id: number): Promise<Employee> {
    let employee: Employee = await this.employeeRepository.findOne({
      where: {
        id: id,
      },
    });

    ExceptionStoreProcedure.validate(employee);
    return employee;
  }
}
