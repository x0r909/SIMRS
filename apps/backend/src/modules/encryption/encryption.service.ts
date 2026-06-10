import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createBlindIndex, decrypt, encrypt, getEncryptionKey } from "../../shared/encryption/crypto";

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;
  private readonly searchKey: Buffer;

  constructor(private readonly config: ConfigService) {
    this.key = getEncryptionKey(
      config.get("ENCRYPTION_KEY") ?? Buffer.alloc(32).toString("base64")
    );
    this.searchKey = getEncryptionKey(
      config.get("ENCRYPTION_SEARCH_KEY") ?? config.get("ENCRYPTION_KEY") ?? Buffer.alloc(32).toString("base64")
    );
  }

  encryptField(value: string): string {
    return encrypt(value, this.key);
  }

  decryptField(ciphertext: string): string {
    return decrypt(ciphertext, this.key);
  }

  blindIndex(value: string): string {
    return createBlindIndex(value, this.searchKey);
  }

  encryptOptional(value?: string | null): string | undefined {
    if (!value) return undefined;
    return this.encryptField(value);
  }

  decryptOptional(ciphertext?: string | null): string | undefined {
    if (!ciphertext) return undefined;
    try {
      return this.decryptField(ciphertext);
    } catch {
      return ciphertext;
    }
  }
}
