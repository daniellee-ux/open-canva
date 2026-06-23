import { init } from './init';
import { build, dev, preview, sync } from './run';

const cmd = process.argv[2];

async function main() {
  switch (cmd) {
    case 'dev':
    case undefined:
      await dev();
      break;
    case 'build':
      await build();
      break;
    case 'preview':
      await preview();
      break;
    case 'sync':
      await sync();
      break;
    case 'init':
      await init(process.argv[3]);
      break;
    default:
      console.error(`Unknown command: ${cmd}\nUsage: opencanva <dev|build|preview|sync|init>`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
