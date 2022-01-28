import { S3Client, waitUntilObjectExists } from '@aws-sdk/client-s3';
import { Transcribe } from '@aws-sdk/client-transcribe';
import { fromEnv } from '@aws-sdk/credential-provider-env';

function getInput(name: string, defaultValue: string | undefined = undefined): string | undefined {
  return process.env[`INPUT_${name.toUpperCase()}`] ?? defaultValue;
}

export async function main() {
  const client = new Transcribe({
    region: process.env.AWS_DEFAULT_REGION,
    credentials: fromEnv(),
  });
  const s3 = new S3Client({
    region: process.env.AWS_DEFAULT_REGION,
    credentials: fromEnv(),
  });

  const jobName = getInput('job_name');
  const src = getInput('src');
  const outputBucketName = getInput('output_bucket');
  const outputKey = getInput('output_key');
  const maxWaitTime = parseInt(getInput('max_wait_time') ?? '600', 10);
  const languageCode = getInput('language_code', 'en-US');

  const result = await client.startTranscriptionJob({
    LanguageCode: languageCode,
    TranscriptionJobName: jobName,
    Media: { MediaFileUri: src },
    OutputBucketName: outputBucketName,
    OutputKey: outputKey,
  });

  if (result.TranscriptionJob?.TranscriptionJobStatus === 'FAILED') {
    process.exit(1);
  }

  await waitUntilObjectExists(
    {
      client: s3,
      maxWaitTime,
    },
    {
      Bucket: outputBucketName,
      Key: outputKey,
    },
  );
}
