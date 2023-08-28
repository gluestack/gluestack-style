import { StyledValueToCSSObject } from '../resolver/StyledValueToCSSObject';
import type { OrderedSXResolved } from '../types';
import { getCSSIdAndRuleset } from '../updateCSSStyleInOrderedResolved.web';
import { deepMerge, resolveTokensFromConfig } from '../utils';
import { inject } from '../utils/css-injector';
export type DeclarationType = 'boot' | 'forwarded';
export class StyleInjector {
  #globalStyleMap: any;

  constructor() {
    this.#globalStyleMap = new Map();
  }

  declare(
    orderedSXResolved: OrderedSXResolved,
    _wrapperElementId: string,
    _styleTagId: any = 'css-injected-boot-time',
    extendedConfig?: any
  ) {
    const styleIds: any = [];
    orderedSXResolved.forEach((styledResolved: any) => {
      if (styledResolved?.meta?.cssId) {
        this.#globalStyleMap.set(styledResolved.meta.cssId, {
          ...styledResolved,
          type: _wrapperElementId,
          componentHash: _styleTagId,
          extendedConfig,
        });
        styleIds.push(styledResolved.meta.cssId);
      }
    });

    return styleIds;
  }

  resolve(
    cssIds: any = [],
    CONFIG: any,
    ExtendedConfig: any,
    resolve: any = true,
    declarationType: string = 'boot'
  ) {
    let componentExtendedConfig = CONFIG;

    if (ExtendedConfig) {
      componentExtendedConfig = deepMerge(CONFIG, ExtendedConfig);
    }

    const toBeInjected: any = {};

    cssIds.forEach((cssId: string) => {
      if (this.#globalStyleMap.get(cssId)) {
        const styledResolved = this.#globalStyleMap.get(cssId);
        const theme = styledResolved?.original;

        if (resolve) {
          this.resolveComponentTheme(
            styledResolved,
            theme,
            componentExtendedConfig,
            styledResolved.componentHash,
            CONFIG,
            declarationType
          );
        }

        if (!toBeInjected[styledResolved.type])
          toBeInjected[styledResolved.type] = {};
        if (!toBeInjected[styledResolved.type][styledResolved.componentHash])
          toBeInjected[styledResolved.type][styledResolved.componentHash] = '';
        toBeInjected[styledResolved.type][styledResolved.componentHash] +=
          styledResolved.meta.cssRuleset;

        // this.injectStyles(
        //   styledResolved.meta.cssRuleset,
        //   styledResolved?.type,
        //   styledResolved?.componentHash
        // );

        this.#globalStyleMap.set(styledResolved.meta.cssId, {
          ...styledResolved,
          value: styledResolved?.resolved,
        });
      }
    });

    return toBeInjected;
  }

  update(orderResolvedStyleMap: any) {
    const toBeInjected: any = {};

    orderResolvedStyleMap.forEach((styledResolved: any) => {
      this.#globalStyleMap.set(styledResolved.meta.cssId, styledResolved);

      if (!toBeInjected[styledResolved.type])
        toBeInjected[styledResolved.type] = {};
      if (!toBeInjected[styledResolved.type][styledResolved.componentHash])
        toBeInjected[styledResolved.type][styledResolved.componentHash] = '';
      toBeInjected[styledResolved.type][styledResolved.componentHash] +=
        styledResolved.meta.cssRuleset;
    });

    return toBeInjected;
  }

  inject(toBeInjected: any) {
    Object.keys(toBeInjected).forEach((type) => {
      Object.keys(toBeInjected[type]).forEach((styleTag) => {
        this.injectStyles(toBeInjected[type][styleTag], type, styleTag);
      });
    });
  }

  resolveComponentTheme(
    componentTheme: any,
    theme: any,
    componentExtendedConfig: any,
    componentHashKey: any,
    CONFIG: any,
    declarationType: string = 'boot'
  ) {
    const prefixClassName = declarationType === 'inline' ? 'gs' : '';
    componentTheme.resolved = StyledValueToCSSObject(
      theme,
      componentExtendedConfig
    );

    // delete componentTheme.meta.cssRuleset;

    if (componentTheme.meta && componentTheme.meta.queryCondition) {
      const queryCondition = resolveTokensFromConfig(CONFIG, {
        condition: componentTheme.meta.queryCondition,
      })?.condition;

      componentTheme.meta.queryCondition = queryCondition;
    }

    const cssData: any = getCSSIdAndRuleset(
      componentTheme,
      componentHashKey,
      prefixClassName
    );

    componentTheme.meta.cssRuleset = cssData.rules.style;
  }

  getStyleMap() {
    return this.#globalStyleMap;
  }

  injectStyles(cssRuleset: any, _wrapperType: any, _styleTagId: any) {
    if (cssRuleset) {
      inject(`@media screen {${cssRuleset}}`, _wrapperType as any, _styleTagId);
    }
  }
}

const stylesheet = new StyleInjector();
export const GluestackStyleSheet = stylesheet;
