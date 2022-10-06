import { NextFunction, Request, Response } from 'express'
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { getApp } from 'firebase/app'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { StatusCodes } from 'http-status-codes'
import { AdminRepository } from '@repositories'
import { AdminRole, FIREBASE_DEFAULT_PW } from '@shared/constants'
import { CreateAdminDto, UpdateAdminDto } from '@dtos'

export class ApiAdministratorsController {
  private adminRepository: AdminRepository

  constructor() {
    this.adminRepository = new AdminRepository()
  }

  public getListAdminUsers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const admins = await this.adminRepository.getAllAdmins()
      res.json(admins)
    } catch (error) {
      next(error)
    }
  }

  public getAdminByEmail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email } = req.body
      const admin = await this.adminRepository.getAdminByEmail(email)
      res.json(admin)
    } catch (error) {
      next(error)
    }
  }

  public addAdminUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, fullName, role } = req.body
      const adminData = plainToInstance(CreateAdminDto, {
        email,
        fullName,
        role: AdminRole[role],
      })
      const errors = await validate(adminData)
      if (errors.length === 0) {
        const adminCredential = await createUserWithEmailAndPassword(
          getAuth(getApp('adminAuth')),
          email,
          FIREBASE_DEFAULT_PW,
        )
        Promise.all([
          sendEmailVerification(adminCredential.user),
          getAuth(getApp('adminAuth')).signOut(),
          this.adminRepository.save(this.adminRepository.create(adminData)),
        ])
        res.json({
          message:
            'Create admin user success! A mail has sent to your email, please verify email!',
        })
      } else {
        res
          .status(StatusCodes.EXPECTATION_FAILED)
          .json({ message: 'Something is error!' })
      }
    } catch (error) {
      res
        .status(StatusCodes.EXPECTATION_FAILED)
        .json({ message: 'Something is error!' })
    }
  }

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const admin = await this.adminRepository.getAdminById(+id)
      await sendPasswordResetEmail(getAuth(getApp('adminAuth')), admin.email, {
        url: `${process.env.APP_HOST}/admin/login`,
      })
      res.json({
        message: 'A mail has been sent to your email to reset password!',
      })
    } catch (error) {
      res
        .status(StatusCodes.EXPECTATION_FAILED)
        .json({ message: 'Something is error!' })
    }
  }

  public updateAdminUser = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params
      const { fullName, role } = req.body
      const adminData = plainToInstance(UpdateAdminDto, {
        fullName,
        role: AdminRole[role],
      })
      const errors = await validate(adminData)
      if (errors.length === 0) {
        await this.adminRepository.updateAdminProfile(+id, adminData)
        res.json({ message: 'Update admin user success!' })
      } else {
        res
          .status(StatusCodes.EXPECTATION_FAILED)
          .json({ message: 'Something is error!' })
      }
    } catch (error) {
      res
        .status(StatusCodes.EXPECTATION_FAILED)
        .json({ message: 'Something is error!' })
    }
  }

  public deleteAdminUser = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params
      await this.adminRepository.softDeleteAdmin(+id)
      res.json({ message: 'Delete admin success' })
    } catch (error) {
      res
        .status(StatusCodes.EXPECTATION_FAILED)
        .json({ message: 'Something is error!' })
    }
  }
}
