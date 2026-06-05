import { randomUUID } from "crypto";
import { extname } from "path";

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, AuditAction } from "@prisma/client";

import { PaginationQueryDto, toSkipTake } from "../../common/pagination/pagination";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { MinioService } from "../../shared/storage/minio.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly audit: AuditLogsService
  ) {}

  async list(query: PaginationQueryDto) {
    const { skip, take, page, limit } = toSkipTake(query.page, query.limit);
    const where: any = query.q
      ? {
          OR: [
            { filename: { contains: query.q, mode: "insensitive" as const } },
            { objectKey: { contains: query.q, mode: "insensitive" as const } }
          ]
        }
      : undefined;

    const [total, data] = await Promise.all([
      this.prisma.fileObject.count({ where }),
      this.prisma.fileObject.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          filename: true,
          mimeType: true,
          size: true,
          bucket: true,
          objectKey: true,
          createdAt: true
        }
      })
    ]);

    return { data, meta: { page, limit, total } };
  }

  async get(id: string) {
    const file = await this.prisma.fileObject.findUnique({ where: { id } });
    if (!file) throw new NotFoundException("File not found");
    return file;
  }

  async upload(actorId: string | undefined, file: Express.Multer.File) {
    if (!file) throw new BadRequestException("File is required");
    if (file.size <= 0) throw new BadRequestException("File is empty");
    
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Only JPG, PNG, and JPEG are accepted. Received: ${file.mimetype}`
      );
    }

    await this.minio.ensureBucket();
    const suffix = extname(file.originalname);
    const objectKey = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}${suffix}`;
    await this.minio.client.putObject(this.minio.bucket, objectKey, file.buffer, file.size, {
      "Content-Type": file.mimetype
    });

    const created = await this.prisma.fileObject.create({
      data: {
        bucket: this.minio.bucket,
        objectKey,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploaderId: actorId
      }
    });
    await this.audit.create({
      actorId,
      action: AuditAction.FILE_UPLOAD,
      entity: "FileObject",
      entityId: created.id,
      metadata: { filename: created.filename, objectKey }
    });
    return created;
  }
}

