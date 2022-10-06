import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { getAuth } from 'firebase-admin/auth'
import { UserRepository } from '@repositories'
import { CreateUserDto } from '@dtos/user.dto'

export class ApiAdminUsersController {
  private userRepository: UserRepository

  constructor() {
    this.userRepository = new UserRepository()
  }

  public getListUsers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const users = await this.userRepository.getAllUsers()
      res.json(users)
    } catch (error) {
      next(error)
    }
  }

  public addUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, fullName } = req.body
      const user = await this.userRepository.findOne({
        where: { email },
      })
      if (!user) {
        const userData = plainToInstance(CreateUserDto, {
          email,
          fullName,
        })
        const errors = await validate(userData)
        if (errors.length === 0) {
          await this.userRepository.save(this.userRepository.create(userData))
          await getAuth().createUser({
            email,
            password,
            displayName: fullName,
            emailVerified: false,
          })
        }
        res.json({ message: 'Create user success!' })
      }
    } catch (error) {
      res
        .status(StatusCodes.EXPECTATION_FAILED)
        .json({ message: 'Something is error!' })
    }
  }

  public updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { email } = await this.userRepository.getUserById(+id)
      const { uid, disabled } = await getAuth().getUserByEmail(email)
      await getAuth().updateUser(uid, {
        disabled: !disabled,
      })
      res.json({ message: 'Update user status success!' })
    } catch (error) {
      res
        .status(StatusCodes.EXPECTATION_FAILED)
        .json({ message: 'Something is error!' })
    }
  }

  public updatePassword = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params
      const { password } = req.body
      const { email } = await this.userRepository.getUserById(+id)
      const { uid } = await getAuth().getUserByEmail(email)
      await getAuth().updateUser(uid, {
        password,
      })
      res.json({ message: 'Update user success!' })
    } catch (error) {
      res
        .status(StatusCodes.EXPECTATION_FAILED)
        .json({ message: 'Something is error!' })
    }
  }

  public deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { email } = await this.userRepository.getUserById(+id)
      const { uid } = await getAuth().getUserByEmail(email)
      await getAuth().deleteUser(uid)
      await this.userRepository.softDelete(+id)
      res.json({ message: 'Delete user success!' })
    } catch (error) {
      res
        .status(StatusCodes.EXPECTATION_FAILED)
        .json({ message: 'Something is error!' })
    }
  }
}
