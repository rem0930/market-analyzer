/**
 * @what ファイルトランスポート
 * @why ログをファイルに永続化し、Coding Agent がトラブルシュート可能に
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface FileTransportOptions {
  /** ログディレクトリのパス */
  directory: string;
  /** ログファイル名（拡張子含む） */
  filename: string;
  /** 最大ファイルサイズ（バイト）。超えるとローテーション */
  maxSize?: number;
  /** 保持する最大ファイル数 */
  maxFiles?: number;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_FILES = 5;

/**
 * ファイルへのログ出力を担当するトランスポート
 */
export class FileTransport {
  private readonly directory: string;
  private readonly filename: string;
  private readonly maxSize: number;
  private readonly maxFiles: number;
  private readonly filePath: string;
  private writeStream: fs.WriteStream | null = null;
  private currentSize = 0;
  private initialized = false;

  constructor(options: FileTransportOptions) {
    this.directory = options.directory;
    this.filename = options.filename;
    this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
    this.maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
    this.filePath = path.join(this.directory, this.filename);
  }

  /**
   * ログディレクトリとファイルを初期化
   */
  private initialize(): void {
    if (this.initialized) return;

    try {
      // ディレクトリが存在しない場合は作成
      if (!fs.existsSync(this.directory)) {
        fs.mkdirSync(this.directory, { recursive: true, mode: 0o700 });
      }

      // 既存ファイルのサイズを取得
      if (fs.existsSync(this.filePath)) {
        const stats = fs.statSync(this.filePath);
        this.currentSize = stats.size;
      }

      // 書き込みストリームを作成（追記モード）
      this.writeStream = fs.createWriteStream(this.filePath, {
        flags: 'a',
        mode: 0o600,
      });

      this.initialized = true;
    } catch (error) {
      // ログ出力の失敗でアプリをクラッシュさせない
      console.error('[FileTransport] Failed to initialize:', error);
    }
  }

  /**
   * ログエントリをファイルに書き込み
   */
  write(entry: string): void {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.writeStream) {
      return;
    }

    const line = entry + '\n';
    const lineSize = Buffer.byteLength(line, 'utf8');

    // ローテーションが必要かチェック
    if (this.currentSize + lineSize > this.maxSize) {
      this.rotate();
    }

    try {
      this.writeStream.write(line);
      this.currentSize += lineSize;
    } catch (error) {
      console.error('[FileTransport] Failed to write:', error);
    }
  }

  /**
   * ログファイルをローテーション
   */
  private rotate(): void {
    try {
      // 現在のストリームを閉じる
      if (this.writeStream) {
        this.writeStream.end();
        this.writeStream = null;
      }

      // 既存のローテーションファイルをシフト
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const oldPath = `${this.filePath}.${i}`;
        const newPath = `${this.filePath}.${i + 1}`;

        if (fs.existsSync(oldPath)) {
          if (i === this.maxFiles - 1) {
            // 最古のファイルは削除
            fs.unlinkSync(oldPath);
          } else {
            fs.renameSync(oldPath, newPath);
          }
        }
      }

      // 現在のファイルを .1 にリネーム
      if (fs.existsSync(this.filePath)) {
        fs.renameSync(this.filePath, `${this.filePath}.1`);
      }

      // 新しいストリームを作成
      this.writeStream = fs.createWriteStream(this.filePath, {
        flags: 'a',
        mode: 0o600,
      });
      this.currentSize = 0;
    } catch (error) {
      console.error('[FileTransport] Failed to rotate:', error);
    }
  }

  /**
   * ストリームを閉じる
   */
  close(): void {
    if (this.writeStream) {
      this.writeStream.end();
      this.writeStream = null;
    }
  }
}

/**
 * ファイルトランスポートを作成するファクトリ関数
 */
export function createFileTransport(options: FileTransportOptions): FileTransport {
  return new FileTransport(options);
}
