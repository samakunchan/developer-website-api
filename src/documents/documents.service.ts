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
    const port = process.env.S3_PUBLIC_PORT;
    const useSSL =
      process.env.S3_PUBLIC_USE_SSL !== undefined ? process.env.S3_PUBLIC_USE_SSL === 'true' : process.env.S3_USE_SSL === 'true';
    const protocol = useSSL ? 'https' : 'http';
    const isPathStyle = endpoint !== 'web.garage.localhost' && !endpoint.endsWith('.localhost');

    const portSuffix = port && port !== '80' && port !== '443' ? `:${port}` : '';

    if (isPathStyle) {
      return `${protocol}://${endpoint}${portSuffix}/${this.bucketName}/${objectName}`;
    }
    return `${protocol}://${this.bucketName}.${endpoint}${portSuffix}/${objectName}`;
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

  /**
   * High-level upload method designed specifically for Multer uploads via HTTP endpoints.
   * Extracts and sanitizes the original client filename, prepends a timestamp to avoid collisions,
   * handles folders, and returns a structured response matching the document schema.
   *
   * @param file Express.Multer.File object from client request
   * @param path Optional directory/prefix path in S3 (defaults to extracting from original name or empty)
   */
  async uploadDocument(file: Express.Multer.File, path?: string): Promise<{ success: boolean; url: string; name: string }> {
    const timestamp = Date.now();

    // Extract folder path if present in originalname or passed explicitly
    const lastSlash = file.originalname.lastIndexOf('/');
    let folderPath = path || '';
    let fileName = file.originalname;
    if (lastSlash !== -1) {
      folderPath = folderPath || file.originalname.substring(0, lastSlash + 1);
      fileName = file.originalname.substring(lastSlash + 1);
    }

    if (folderPath && !folderPath.endsWith('/')) {
      folderPath = `${folderPath}/`;
    }

    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const cleanFolderPath = folderPath.replace(/[^a-zA-Z0-9./-]/g, '_');
    const objectName = `${cleanFolderPath}${timestamp}-${cleanFileName}`;

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

  /**
   * Low-level upload method designed for generic programmatic file uploads.
   * Unlike `uploadDocument`, this accepts raw in-memory Buffers (e.g. processed image buffers from sharp)
   * and uploads them directly to a custom, specific S3 key path.
   *
   * @param key Fully structured target S3 key (e.g. 'avatars/avatar-123-tiny.webp')
   * @param buffer Raw file Buffer
   * @param mimetype Content-Type header value
   */
  async uploadFile(key: string, buffer: Buffer, mimetype: string): Promise<string> {
    try {
      await this.minioClient.putObject(this.bucketName, key, buffer, buffer.length, { 'Content-Type': mimetype });
      return this.getPublicUrl(key);
    } catch (err: any) {
      throw new InternalServerErrorException(`Failed to upload file to S3: ${err.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, key);
    } catch (err: any) {
      throw new InternalServerErrorException(`Failed to delete file from S3: ${err.message}`);
    }
  }
}
