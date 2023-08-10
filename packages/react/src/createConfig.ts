import type { GlueStackConfig } from './types';

var globalPluginStore: any = [];

function setGlobalPluginStore(plugins: Array<any>) {
  globalPluginStore.push(...plugins);
}

function getGlobalPluginStore() {
  return globalPluginStore;
}

export function getInstalledPlugins() {
  return getGlobalPluginStore();
}

export const createConfig = <
  //@ts-ignore
  T extends GlueStackConfig<T['tokens'], T['aliases'], T['globalStyle']>
>(
  //@ts-ignore
  config: T | GlueStackConfig<T['tokens'], T['aliases'], T['globalStyle']>
): T => {
  if (config.plugins) {
    setGlobalPluginStore(config.plugins);
  }
  delete config.plugins;
  return config as any;
};
