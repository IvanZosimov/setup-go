import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as installer from './installer';
import * as path from 'path';

export async function run() {
  try {
    //
    // versionSpec is optional.  If supplied, install / use from the tool cache
    // If not supplied then problem matchers will still be setup.  Useful for self-hosted.
    //
    let versionSpec = core.getInput('go-version');
    let stable: boolean = (core.getInput('stable') || '').toUpperCase() == "TRUE";

    if (versionSpec) {
        let installDir: string | undefined = tc.find('go', versionSpec);

        if (!installDir) {
            installDir = await installer.downloadGo(versionSpec, stable);
        }
        
        if (installDir) {
            core.exportVariable('GOROOT', installDir);
            core.addPath(path.join(installDir, 'bin'));
        }   
        else {
            throw new Error(`Could not find a version that satisfied version spec: ${versionSpec}`);
        }
    }

    // add problem matchers
    const matchersPath = path.join(__dirname, '..', 'matchers.json');
    console.log(`##[add-matcher]${matchersPath}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}