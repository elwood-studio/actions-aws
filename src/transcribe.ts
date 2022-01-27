import { S3Client, waitUntilObjectExists } from '@aws-sdk/client-s3';
import { Transcribe } from '@aws-sdk/client-transcribe';
import { fromEnv } from '@aws-sdk/credential-provider-env';

function getInput(name: string, defaultValue = undefined): string | undefined {
  return process.env[name.toUpperCase()] ?? defaultValue;
}

async function main() {
  const client = new Transcribe({
    credentials: fromEnv(),
  });
  const s3 = new S3Client({
    credentials: fromEnv(),
  });

  const jobName = getInput('job_name');
  const src = getInput('src');
  const outputBucketName = getInput('output_bucket');
  const outputKey = getInput('output_key');
  const maxWaitTime = parseInt(getInput('max_wait_time') ?? '600', 10);

  const result = await client.startTranscriptionJob({
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
