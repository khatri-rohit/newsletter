import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { R2Config } from "./types";

export class R2Service {
  private client: S3Client;
  private bucketName: string;

  constructor(config: R2Config) {
    // Cloudflare R2 endpoint format
    const endpoint = `https://5a8d674f83ca3fb12bdcb750284dd551.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: "auto",
      endpoint: endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // R2 uses virtual-hosted-style URLs, not path-style
      forcePathStyle: false,
    });

    this.bucketName = config.bucketName;
  }

  /**
   * Lists objects in a specific folder (prefix)
   */
  async listObjects(prefix: string): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const response = await this.client.send(command);

      if (!response.Contents) {
        return [];
      }

      return response.Contents.filter(
        (obj) => obj.Key && obj.Key.endsWith(".md"),
      ).map((obj) => obj.Key!);
    } catch (error) {
      console.error("Error listing objects:", error);
      throw error;
    }
  }

  /**
   * Gets the content of a specific file
   */
  async getObject(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new Error("No content found");
      }

      const content = await response.Body.transformToString();
      return content;
    } catch (error) {
      console.error("Error getting object:", error);
      throw error;
    }
  }

  /**
   * Finds and retrieves a specific .md file in a folder
   */
  async getFileFromFolder(
    date: string,
    filename: string,
  ): Promise<string | null> {
    try {
      // Ensure filename ends with .md
      const mdFilename = filename.endsWith(".md") ? filename : `${filename}.md`;

      // List all files in the date folder
      const prefix = `${date}/`;
      const files = await this.listObjects(prefix);

      // Find the matching file
      const matchingFile = files.find((file) => {
        const fileName = file.split("/").pop();
        return fileName === mdFilename;
      });

      if (!matchingFile) {
        return null;
      }

      // Get the file content
      const content = await this.getObject(matchingFile);
      return content;
    } catch (error) {
      console.error("Error getting file from folder:", error);
      throw error;
    }
  }
}
