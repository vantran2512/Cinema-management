import { Router } from 'express'
import { AdminUsersController } from '@app/controllers'
import { adminRoleMiddleware } from '@app/middlewares'

class AdminUsersRoute {
  public path = '/admin/users'
  public router = Router()

  private adminUsersController: AdminUsersController

  constructor() {
    this.adminUsersController = new AdminUsersController()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.route('/').get(this.adminUsersController.getListUsers)
    this.router
      .route('/:id(\\d+)')
      .get(
        adminRoleMiddleware.isNotViewer,
        this.adminUsersController.getUpdateUserView,
      )
    this.router
      .route('/add')
      .get(
        adminRoleMiddleware.isNotViewer,
        this.adminUsersController.getAddUserView,
      )
  }
}

export const adminUsersRoute = new AdminUsersRoute()
