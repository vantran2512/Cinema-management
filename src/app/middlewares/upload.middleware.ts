import Multer, { memoryStorage } from 'multer'

export const uploadMiddleware = Multer({ storage: memoryStorage() }).single(
  'upload',
)
