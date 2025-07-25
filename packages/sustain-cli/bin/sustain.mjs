#!/usr/bin/env node
/**
 * Sustain CLI – step 1
 * Prints aggregate RAM + storage estimates for any Docker
 * dev‑container / compose stack in the current working directory.
 */
import { collectDockerResources } from '@randish/sustain-core';

(async () => {
  const summary = await collectDockerResources(process.cwd());

  const mb = bytes => (bytes / 2 ** 20).toFixed(1); // bytes → MiB

  console.log('Docker images:');
  summary.images.forEach(img => {
    const memTxt =
      img.memoryLimitBytes == null
        ? ''
        : `  mem≤${mb(img.memoryLimitBytes)} MiB`;
    console.log(`• ${img.name.padEnd(30)}  ${mb(img.storageBytes)} MiB${memTxt}`);
  });

  console.log('\nTotal storage:', mb(summary.totalStorageBytes), 'MiB');
  if (summary.totalMemoryLimitBytes != null) {
    console.log('Total memory limit:', mb(summary.totalMemoryLimitBytes), 'MiB');
  } else {
    console.log('No memory limits declared');
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
