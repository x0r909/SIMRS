/**
 * @file minio.service.ts
 * @path apps/backend/src/shared/storage/minio.service.ts
 * @description Integrasi MinIO object storage.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "minio";

@Injectable()
export class MinioService {
  public readonly client: Client;
  public readonly bucket: string;

  constructor(config: ConfigService) {
    const endPoint = config.getOrThrow<string>("MINIO_ENDPOINT");
    const port = Number(config.get("MINIO_PORT", 9000));
    const useSSL = String(config.get("MINIO_USE_SSL", "false")).toLowerCase() === "true";
    const accessKey = config.getOrThrow<string>("MINIO_ACCESS_KEY");
    const secretKey = config.getOrThrow<string>("MINIO_SECRET_KEY");
    this.bucket = config.getOrThrow<string>("MINIO_BUCKET");

    this.client = new Client({ endPoint, port, useSSL, accessKey, secretKey });
  }

  async ensureBucket() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) await this.client.makeBucket(this.bucket);
  }
}

