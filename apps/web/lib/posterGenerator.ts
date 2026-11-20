/**
 * POPO LIVE — SERVER-SIDE ACHIEVEMENT POSTER GENERATOR (WEB RUNTIME)
 * 
 * Generates valid PNG achievement posters using native zlib and binary chunk construction.
 */

import zlib from 'zlib';

export interface PosterData {
  userId: string;
  nickname: string;
  poppoId: string;
  wealthLevel: number;
  hostLevel: number;
  medalsCount: number;
  badgeLabel?: string;
}

export class PosterGenerator {
  private static readonly WIDTH = 600;
  private static readonly HEIGHT = 800;

  public static generatePosterPng(data: PosterData): Buffer {
    const width = this.WIDTH;
    const height = this.HEIGHT;

    const scanlineLength = width * 4 + 1;
    const rawData = Buffer.alloc(scanlineLength * height);

    const bgTop = [26, 26, 36];
    const bgBottom = [17, 24, 39];
    const pinkAccent = [236, 72, 153];
    const goldAccent = [245, 158, 11];

    for (let y = 0; y < height; y++) {
      const rowOffset = y * scanlineLength;
      rawData[rowOffset] = 0;

      const ratio = y / height;
      const r = Math.round(bgTop[0] * (1 - ratio) + bgBottom[0] * ratio);
      const g = Math.round(bgTop[1] * (1 - ratio) + bgBottom[1] * ratio);
      const b = Math.round(bgTop[2] * (1 - ratio) + bgBottom[2] * ratio);

      for (let x = 0; x < width; x++) {
        const pixelOffset = rowOffset + 1 + x * 4;

        const isBorder = (x < 16 || x > width - 16 || y < 16 || y > height - 16);
        const isCardHeader = (y >= 40 && y <= 160 && x >= 40 && x <= width - 40);
        const isMedalGrid = (y >= 450 && y <= 650 && x >= 50 && x <= width - 50);

        if (isBorder) {
          rawData[pixelOffset] = goldAccent[0];
          rawData[pixelOffset + 1] = goldAccent[1];
          rawData[pixelOffset + 2] = goldAccent[2];
          rawData[pixelOffset + 3] = 255;
        } else if (isCardHeader) {
          rawData[pixelOffset] = Math.round(pinkAccent[0] * 0.3 + r * 0.7);
          rawData[pixelOffset + 1] = Math.round(pinkAccent[1] * 0.3 + g * 0.7);
          rawData[pixelOffset + 2] = Math.round(pinkAccent[2] * 0.3 + b * 0.7);
          rawData[pixelOffset + 3] = 255;
        } else if (isMedalGrid) {
          rawData[pixelOffset] = Math.round(goldAccent[0] * 0.2 + r * 0.8);
          rawData[pixelOffset + 1] = Math.round(goldAccent[1] * 0.2 + g * 0.8);
          rawData[pixelOffset + 2] = Math.round(goldAccent[2] * 0.2 + b * 0.8);
          rawData[pixelOffset + 3] = 255;
        } else {
          rawData[pixelOffset] = r;
          rawData[pixelOffset + 1] = g;
          rawData[pixelOffset + 2] = b;
          rawData[pixelOffset + 3] = 255;
        }
      }
    }

    const compressedData = zlib.deflateSync(rawData);

    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    const ihdrPayload = Buffer.alloc(13);
    ihdrPayload.writeUInt32BE(width, 0);
    ihdrPayload.writeUInt32BE(height, 4);
    ihdrPayload.writeUInt8(8, 8);
    ihdrPayload.writeUInt8(6, 9);
    ihdrPayload.writeUInt8(0, 10);
    ihdrPayload.writeUInt8(0, 11);
    ihdrPayload.writeUInt8(0, 12);
    const ihdrChunk = this.createChunk('IHDR', ihdrPayload);

    const idatChunk = this.createChunk('IDAT', compressedData);
    const iendChunk = this.createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
  }

  private static createChunk(type: string, data: Buffer): Buffer {
    const length = data.length;
    const typeBuf = Buffer.from(type, 'ascii');
    const chunk = Buffer.alloc(4 + 4 + length + 4);

    chunk.writeUInt32BE(length, 0);
    typeBuf.copy(chunk, 4);
    data.copy(chunk, 8);

    const crcData = Buffer.concat([typeBuf, data]);
    const crc = this.calculateCrc32(crcData);
    chunk.writeUInt32BE(crc, 8 + length);

    return chunk;
  }

  private static calculateCrc32(buf: Buffer): number {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        if ((crc ^ byte) & 1) {
          crc = (crc >>> 1) ^ 0xedb88320;
        } else {
          crc = crc >>> 1;
        }
        byte = byte >>> 1;
      }
    }
    return (crc ^ -1) >>> 0;
  }
}
