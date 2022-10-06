import { Admin } from '@entities'
import dataSource from '@shared/configs/data-source.config'
import { IsNull, Repository } from 'typeorm'

export class AdminRepository extends Repository<Admin> {
  constructor() {
    super(Admin, dataSource.manager)
  }

  public getAllAdmins() {
    return this.find({
      where: {
        deletedAt: IsNull(),
      },
      order: { role: 'ASC' },
    })
  }

  public getAdminById(id: number) {
    return this.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    })
  }

  public getAdminByEmail(email: string) {
    return this.findOne({
      where: {
        email,
        deletedAt: IsNull(),
      },
    })
  }

  public softDeleteAdmin(id: number) {
    return this.softDelete(id)
  }

  public async updateAdminProfile(id: number, { fullName, role }) {
    await this.createQueryBuilder()
      .update(Admin)
      .set({
        fullName,
        role,
      })
      .where('id = :id')
      .setParameters({ id })
      .execute()
  }
}
