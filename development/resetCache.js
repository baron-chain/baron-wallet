import { spawn, ChildProcess } from 'child_process';

interface ExecResult {
  code: number | null;
  signal: NodeJS.Signals | null;
  child: ChildProcess;
}

function exec(fullCmd: string): Promise<ExecResult> {
  const [cmd, ...args] = fullCmd.split(/\s+/);
  
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: [
        process.stdin, // 0 use parents stdin for child
        process.stdout, // 1 use parent's stdout stream - IMPORTANT if we don't do this things like the spinner will break the automation.
        'pipe', // 2 pipe child's stderr to parent
      ],
    });

    child.on('close', (code, signal) => {
      resolve({
        code,
        signal,
        child,
      });
    });
  });
}

async function main() {
  try {
    // Clean ReactNative and Expo Metro bundler cache
    await exec('yarn expo start --clear');
    await exec('yarn react-native start --reset-cache');
    // await exec('yarn expo build:ios --clear-provisioning-profile');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Exit after 20 seconds
    setTimeout(() => {
      process.exit(0);
    }, 20 * 1000);
  }
}

main();
