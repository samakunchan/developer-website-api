import { Injectable, OnModuleInit, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class DocumentsService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly bucketName = process.env.S3_BUCKET_NAME || 'papanguesoft';

  constructor() {
    const isDocker = process.env.DOCKER === 'true';
    let endPoint = process.env.S3_ENDPOINT || 'localhost';

    // Auto-resolve S3 endpoint inside Docker container to connect to host Machine
    if (isDocker && (endPoint === 'localhost' || endPoint === '127.0.0.1')) {
      endPoint = 'host.docker.internal';
    }

    this.minioClient = new Minio.Client({
      endPoint,
      port: process.env.S3_PORT ? parseInt(process.env.S3_PORT, 10) : 3900,
      useSSL: process.env.S3_USE_SSL === 'true',
      accessKey: process.env.S3_ACCESS_KEY || 'S3_ACCESS_KEY',
      secretKey: process.env.S3_SECRET_KEY || 'S3_SECRET_KEY',
      region: process.env.S3_REGION || 'garage',
    });
  }

  private getPublicUrl(objectName: string): string {
    const endpoint = process.env.S3_PUBLIC_ENDPOINT || 'web.garage.localhost';
    const port = process.env.S3_PUBLIC_PORT || '3902';
    const protocol = process.env.S3_USE_SSL === 'true' ? 'https' : 'http';
    return `${protocol}://${this.bucketName}.${endpoint}:${port}/${objectName}`;
  }

  async onModuleInit() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, process.env.S3_REGION || 'garage');
        console.log(`🗄️ Garage S3: Created bucket "${this.bucketName}"`);
      } else {
        console.log(`🗄️ Garage S3: Connected to bucket "${this.bucketName}"`);
      }
    } catch (err) {
      console.error('❌ Garage S3 Connection Error:', err);
    }
  }

  async uploadDocument(file: Express.Multer.File): Promise<{ success: boolean; url: string; name: string }> {
    const timestamp = Date.now();
    // Replace spaces and special characters with underscore
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectName = `${timestamp}-${cleanOriginalName}`;

    try {
      await this.minioClient.putObject(this.bucketName, objectName, file.buffer, file.size, { 'Content-Type': file.mimetype });

      const url = this.getPublicUrl(objectName);

      return {
        success: true,
        url,
        name: objectName,
      };
    } catch (err) {
      throw new InternalServerErrorException(`Failed to upload document to S3: ${err.message}`);
    }
  }

  async listDocuments(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const objectsList: any[] = [];
      const stream = this.minioClient.listObjectsV2(this.bucketName, '', true);

      stream.on('data', (obj) => {
        if (!obj.name) return;
        const url = this.getPublicUrl(obj.name);

        objectsList.push({
          name: obj.name,
          lastModified: obj.lastModified,
          size: obj.size,
          url,
        });
      });

      stream.on('error', (err) => {
        reject(new InternalServerErrorException(`Failed to list S3 objects: ${err.message}`));
      });

      stream.on('end', () => {
        // Sort documents by lastModified descending if possible
        objectsList.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
        resolve(objectsList);
      });
    });
  }

  async deleteDocument(name: string): Promise<{ success: boolean }> {
    try {
      // Check if object exists or try to delete
      await this.minioClient.statObject(this.bucketName, name);
    } catch (err: any) {
      if (err.code === 'NotFound') {
        throw new NotFoundException(`Document with name "${name}" not found in storage.`);
      }
      throw new InternalServerErrorException(`Failed to check document in S3: ${err.message}`);
    }

    try {
      await this.minioClient.removeObject(this.bucketName, name);
      return { success: true };
    } catch (err: any) {
      throw new InternalServerErrorException(`Failed to delete document from S3: ${err.message}`);
    }
  }
}
