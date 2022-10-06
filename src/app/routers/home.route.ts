import { Router } from 'express'
import { HomeController } from '@app/controllers'
// import test
import { uploadMiddleware } from '@middlewares'

class HomeRoute {
  public path = '/'
  public router = Router()

  private homeController: HomeController

  constructor() {
    this.homeController = new HomeController()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.route('/').get(this.homeController.home)
    this.router.route('/login').post(this.homeController.login)
    this.router.route('/logout').get(this.homeController.logout)
    this.router.route('/lang').get(this.homeController.configLanguage)
    // route test
    this.router
      .route('/upload')
      .get(this.homeController.getViewUpload)
      .post(uploadMiddleware, this.homeController.upload)
    this.router.route('/download/:filename').get(this.homeController.download)
  }
}

export const homeRoute = new HomeRoute()
