import { storagePut } from '../server/storage';

async function main() {
  console.log('Testing storage upload...');
  
  try {
    const testData = Buffer.from('Hello, this is a test file for KYC upload debugging');
    const result = await storagePut('test/kyc-debug-test.txt', testData, 'text/plain');
    console.log('Upload successful!');
    console.log('Result:', result);
  } catch (error) {
    console.error('Upload failed!');
    console.error('Error:', error);
  }
}

main();
