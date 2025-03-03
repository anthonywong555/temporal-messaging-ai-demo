import { DataConverter } from '@temporalio/common';
import { EncryptionCodec } from './encryption-codec';
import { PAYLOAD_CODECS_KEY_ID } from './constant';

let dataConverterPromise: Promise<DataConverter>;

export async function getDataConverter(): Promise<DataConverter> {
  if (!dataConverterPromise) {
    dataConverterPromise = createDataConverter();
  }
  return await dataConverterPromise;
}

async function createDataConverter(): Promise<DataConverter> {
  return {
    payloadCodecs: [await EncryptionCodec.create(PAYLOAD_CODECS_KEY_ID)],
  };
}