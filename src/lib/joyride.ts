/* eslint-disable @typescript-eslint/no-var-requires */
import type JoyrideModule from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';

type JoyrideExports = typeof import('react-joyride');

const joyrideModule = require('react-joyride') as JoyrideExports | {
  default: JoyrideModule;
};

const resolvedModule =
  'default' in joyrideModule ? joyrideModule : { default: joyrideModule };

const Joyride = resolvedModule.default as JoyrideModule;

export const ACTIONS = (joyrideModule as JoyrideExports).ACTIONS;
export const EVENTS = (joyrideModule as JoyrideExports).EVENTS;
export const STATUS = (joyrideModule as JoyrideExports).STATUS;

export type { CallBackProps, Step };

export default Joyride;
