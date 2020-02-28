import console from 'console';
import createDebug from 'debug';
// @ts-ignore
import {name} from './../../package.json';

const debug = createDebug(name);

export default debug;

export const dir = (...args: unknown[]) => {
  console.dir(args.length > 1 ? args : args[0], {colors: true, depth: 10});
};
