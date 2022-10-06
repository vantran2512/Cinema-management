import { Client } from 'minio'

export const minioClient = new Client({
  endPoint: `${process.env.APP_NAME}-minio`,
  port: +process.env.MINIO_PORT,
  useSSL: false,
  accessKey: process.env.MINIO_USER,
  secretKey: process.env.MINIO_PASSWORD,
})
