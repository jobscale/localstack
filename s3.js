const fs = require('fs');
const {
  S3Client, HeadBucketCommand, CreateBucketCommand,
  GetObjectCommand, PutObjectCommand,
} = require('@aws-sdk/client-s3');

const auth = JSON.parse(Buffer.from('eyJpZCI6IkFLSUEyWFBUNkVEN09WQTY3SVY3Iiwia2V5IjoiNjM5YUtFWWRMV3Y5YXVoUlltT0F1ZXRUVDFzYUkvVEhJMHg5ZVBENiJ9', 'base64').toString());
const region = 'ap-northeast-1';
const { endpoint, Bucket } = {
  test1: {
    endpoint: 'http://127.0.0.1:4566',
    Bucket: 'sample-storage',
  },
  test2: {
    endpoint: 'https://lo-stack.jsx.jp',
    Bucket: 'test-store',
  },
}['test1'];
const logger = console;
const s3 = new S3Client({
  endpoint,
  urlParser: url => {
    const op = new URL(url);
    return {
      protocol: op.protocol,
      hostname: op.hostname,
      port: op.port,
      path: op.pathname,
    };
  },
  endpointProvider: ep => ({ url: `${ep.Endpoint}${ep.Bucket}/` }),
  region,
  credentials: {
    accessKeyId: auth.id,
    secretAccessKey: auth.key,
  },
});

const fetchObjectChunk = res => new Promise((resolve, reject) => {
  const dataChunks = [];
  res.Body.once('error', e => reject(e));
  res.Body.on('data', chunk => dataChunks.push(Buffer.from(chunk)));
  res.Body.once('end', () => resolve(Buffer.concat(dataChunks)));
});

class App {
  getItem(Key) {
    return s3.send(new GetObjectCommand({
      Bucket, Key,
    }));
  }

  putItem(Key, Body) {
    return s3.send(new PutObjectCommand({
      Bucket, Key, Body,
    }));
  }

  createBucket() {
    return s3.send(new HeadBucketCommand({ Bucket }))
    .catch(e => {
      if (e.name !== 'NotFound') throw e;
      return s3.send(new CreateBucketCommand({ Bucket }));
    });
  }

  async main() {
    const key = 'uni/train/fast/dataset';
    const data1 = JSON.stringify({ ts: Date.now(), color: ['red', 'green', 'blue'] });
    await this.createBucket();
    await this.putItem(key, data1);
    const item1 = await this.getItem(key)
    .then(res => fetchObjectChunk(res));
    logger.info({ item1: item1.toString('utf8') });

    const fname = '/home/jobscale/Documents/contents/0-67.jpg';
    const key2 = 'uni/train/fast/dataset2';
    const data2 = fs.readFileSync(fname);
    await this.putItem(key2, data2);
    const item2 = await this.getItem(key2)
    .then(res => fetchObjectChunk(res));
    logger.info({
      data2: data2.length,
      item2: item2.length,
      verify: data2.toString('base64') === item2.toString('base64'),
    });

    debugger;
    const item11 = await this.getItem(key)
    .then(res => fetchObjectChunk(res));
    const item21 = await this.getItem(key2)
    .then(res => fetchObjectChunk(res));
    logger.debug({
      item11: item11.length,
      item21: item21.length,
    });

    return { ok: true };
  }
}

const app = new App();
app.main()
.catch(e => {
  logger.error({ name: e.name, message: e.message });
})
.then(res => {
  logger.info(JSON.stringify(res, null, 2));
});
