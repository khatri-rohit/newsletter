export interface ContentMetadata {
  newContentType: string;
  newMetadata: {
    key: string;
    type: string;
    title: string;
    authors: string;
    "source-name": string;
    "external-source-urls": string;
    "image-urls": string;
    url: string;
    timestamp: string;
    "feed-url": string;
  };
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}
