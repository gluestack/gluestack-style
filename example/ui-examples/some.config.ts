import myConfig from './some-other.config';

const newConfig = {
  ...myConfig,
  MyConfigOverride: 'some-value',
} as const;

export default newConfig;
