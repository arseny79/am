import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

function getS3Client(): S3Client {
  const config: ConstructorParameters<typeof S3Client>[0] = {
    region: ENV.awsRegion,
    credentials: {
      accessKeyId: ENV.awsAccessKeyId,
      secretAccessKey: ENV.awsSecretAccessKey,
    },
  };
  if (ENV.awsS3Endpoint) {
    config.endpoint = ENV.awsS3Endpoint;
    config.forcePathStyle = true; // required for R2 and MinIO
  }
  return new S3Client(config);
}

function getBucket(): string {
  if (!ENV.awsS3Bucket) {
    throw new Error("Storage not configured: set AWS_S3_BUCKET environment variable");
  }
  return ENV.awsS3Bucket;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function buildPublicUrl(key: string): string {
  if (ENV.awsS3PublicUrl) {
    const base = ENV.awsS3PublicUrl.replace(/\/+$/, "");
    return `${base}/${key}`;
  }
  const region = ENV.awsRegion;
  const bucket = ENV.awsS3Bucket;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  const bucket = getBucket();
  const key = normalizeKey(relKey);
  const body = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return { key, url: buildPublicUrl(key) };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  const bucket = getBucket();
  const key = normalizeKey(relKey);

  // Presigned URL valid for 1 hour (safe for private docs like KYC)
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 3600 }
  );

  return { key, url };
}

// M8: Delete a file from storage
export async function storageDelete(relKey: string): Promise<void> {
  const client = getS3Client();
  const bucket = getBucket();
  const key = normalizeKey(relKey);

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
