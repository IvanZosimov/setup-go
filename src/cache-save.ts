import * as core from '@actions/core';
import * as cache from '@actions/cache';
import fs from 'fs';
import {State} from './constants';
import {getCacheDirectoryPath, getPackageManagerInfo} from './cache-utils';

// Catch and log any unhandled exceptions.  These exceptions can leak out of the uploadChunk method in
// @actions/toolkit when a failed upload closes the file descriptor causing any in-process reads to
// throw an uncaught exception.  Instead of failing this action, just warn.
process.on('uncaughtException', e => {
  const warningPrefix = '[warning]';
  core.info(`${warningPrefix}${e.message}`);
});

export async function run() {
  try {
    await cachePackages();
  } catch (error) {
    core.setFailed(error.message);
  }
}

const cachePackages = async () => {
  const cachingFlag = core.getInput('cache');
  if (!cachingFlag) return;

  const state = core.getState(State.CacheMatchedKey);
  const primaryKey = core.getState(State.CachePrimaryKey);

  const packageManagerInfo = await getPackageManagerInfo();

  const cachePath = await getCacheDirectoryPath(packageManagerInfo);

  if (!fs.existsSync(cachePath)) {
    throw new Error(
      `Cache folder path is retrieved but doesn't exist on disk: ${cachePath}`
    );
  }

  if (primaryKey === state) {
    core.info(
      `Cache hit occurred on the primary key ${primaryKey}, not saving cache.`
    );
    return;
  }

  try {
    await cache.saveCache([cachePath], primaryKey);
    core.info(`Cache saved with the key: ${primaryKey}`);
  } catch (error) {
    if (error.name === cache.ValidationError.name) {
      throw error;
    } else if (error.name === cache.ReserveCacheError.name) {
      core.info(error.message);
    } else {
      core.warning(`${error.message}`);
    }
  }
};

run();
