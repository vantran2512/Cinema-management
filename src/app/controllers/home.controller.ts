import { NextFunction, Request, Response } from 'express'
import { DecodedIdToken, getAuth } from 'firebase-admin/auth'
import { StatusCodes } from 'http-status-codes'
import { CreateUserDto } from '@dtos'
import { User } from '@entities'
import { UserRepository, MovieRepository } from '@repositories'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { __ } from 'i18n'
import { minioClient } from '@shared/configs/minio.config'
import { generateFileName } from '@app/helpers/upload.helper'

export class HomeController {
  private userRepository: UserRepository
  private movieRepository: MovieRepository

  constructor() {
    this.userRepository = new UserRepository()
    this.movieRepository = new MovieRepository()
  }

  public home = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { user } = res.locals
      const [movies, movieLatest, movieTopRated, movieComingSoon] =
        await Promise.all([
          this.movieRepository.getAllMovie(),
          this.movieRepository.getLatestMovies(),
          this.movieRepository.getTopRateMovies(),
          this.movieRepository.getComingSoonMovies(),
        ])

      res.render('home', {
        title: __('Home'),
        username: user?.fullName,
        movies,
        prevMovie: movies[movies.length - 1],
        nextMovie: movies[1],
        movieLatest,
        movieTopRated,
        movieComingSoon,
      })
    } catch (error) {
      next(error)
    }
  }

  public login = async (req: Request, res: Response): Promise<void> => {
    const { idToken } = req.body
    let response: DecodedIdToken
    try {
      response = await getAuth().verifyIdToken(idToken)
      const user: User = await this.userRepository.findOne({
        where: {
          email: response.email,
        },
        withDeleted: true,
      })
      if (!user) {
        const userData = plainToInstance(CreateUserDto, {
          email: response.email,
          fullName: response.name,
        })
        const errors = await validate(userData)
        if (errors.length === 0) {
          await this.userRepository.save(this.userRepository.create(userData))
        }
      } else {
        if (user.deletedAt) {
          await this.userRepository.restore(user.id)
        }
        if (!user.avatarUrl && response.picture) {
          user.avatarUrl = response.picture
          await this.userRepository.save(user)
        }
      }
      const expiresIn = 24 * 60 * 60 * 1000 * +process.env.SESSION_LOGIN_DAYS
      const session = await getAuth().createSessionCookie(idToken, {
        expiresIn,
      })
      res.cookie('authToken', session, {
        expires: new Date(Date.now() + expiresIn),
      })
      res.status(StatusCodes.OK).json({ message: 'Login success' })
    } catch (error) {
      res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: __('Something is error!') })
    }
  }

  public logout = (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.clearCookie('authToken')
      res.redirect('back')
    } catch (error) {
      next(error)
    }
  }

  public configLanguage = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    try {
      const { lang } = req.query
      res.cookie('language', lang, { maxAge: 900000, httpOnly: true })
      res.redirect('back')
    } catch (error) {
      next(error)
    }
  }

  public getViewUpload = (req: Request, res: Response): void => {
    res.render('test-upload', { layout: null })
  }

  public upload = async (req: Request, res: Response): Promise<void> => {
    // minioClient.putObject(
    //   'data',
    //   generateFileName(req.file.originalname),
    //   req.file.buffer,
    //   (err, etag) => {
    //     if (err) {
    //       return res.send(err.message)
    //     }
    //     console.log(etag)
    //     res.send(req.file)
    //   },
    // )
    const fileName = generateFileName(req.file.originalname)
    try {
      await minioClient.putObject('data', fileName, req.file.buffer)
      const url = await minioClient.presignedGetObject('data', fileName)
      res.json({ url })
    } catch (err) {
      res.json({ message: 'Upload error' })
    }
  }

  public download = (req: Request, res: Response): void => {
    const { filename } = req.params
    minioClient.getObject('data', filename, (error, stream) => {
      if (error) {
        return res.status(500).send(error)
      }
      res.set('content-disposition', `attachment; filename="${filename}"`)
      stream.pipe(res)
    })
  }
}
