// src/lib/minio.ts
import { Client } from 'minio';

if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY || !process.env.S3_ENDPOINT) {
  throw new Error('MinIO credentials are required');
}

export const minioClient = new Client({
  endPoint: process.env.S3_ENDPOINT!,
  port: parseInt(process.env.S3_PORT || '443'),
  useSSL: process.env.S3_USE_SSL === 'true',
  accessKey: process.env.S3_ACCESS_KEY!,
  secretKey: process.env.S3_SECRET_KEY!,
  region: process.env.S3_REGION || 'us-east-1',
});

export const S3_BUCKET = process.env.S3_BUCKET || 'campanhas';

// Função para gerar URL pública do arquivo
export function getPublicUrl(fileName: string): string {
  const protocol = process.env.S3_USE_SSL === 'true' ? 'https' : 'http';
  const port = process.env.S3_PORT && process.env.S3_PORT !== '443' && process.env.S3_PORT !== '80'
    ? `:${process.env.S3_PORT}`
    : '';

  return `${protocol}://${process.env.S3_ENDPOINT}${port}/${S3_BUCKET}/${fileName}`;
}

// Função para validar tipo de arquivo
export function validateFileType(fileName: string, allowedTypes: string[]): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

// Tipos de arquivo permitidos por tipo de template
export const ALLOWED_FILE_TYPES = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  video: ['mp4', 'avi', 'mov', 'wmv', 'flv', '3gp'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
  sticker: ['webp', 'png']
};
