import React, { useMemo } from 'react';
import type { IStyled, IStyledPlugin } from '../createStyled';
import { useStyled } from '../StyledProvider';
import { propertyTokenMap } from '../propertyTokenMap';
import { deepMergeObjects } from '../utils';
import { getVariantProps } from '../styled';
import { deepMerge, setObjectKeyValue } from '../core/utils';

const fontWeights: any = {
  '100': 'Thin',
  '200': 'ExtraLight',
  '300': 'Light',
  '400': 'Regular',
  '500': 'Medium',
  '600': 'SemiBold',
  '700': 'Bold',
  '800': 'ExtraBold',
  '900': 'Black',
  '950': 'ExtraBlack',
};

const STYLE_FONT_RESOLVER_STRATEGY = 'web';

const tokenizeFontsConfig = (
  styledObject?: any,
  { fontsTokens, fontWeightsTokens }: any = {}
) => {
  const { fontFamily, fontWeight } = styledObject;

  if (fontFamily?.startsWith('$')) {
    const fontFamilyValue = fontFamily.slice(1);
    styledObject.fontFamily = fontsTokens?.[fontFamilyValue];
  }
  if (typeof fontWeight === 'string' && fontWeight?.startsWith('$')) {
    const fontWeightValue = fontWeight.slice(1);
    styledObject.fontWeight = fontWeightsTokens?.[fontWeightValue];
  }
};

function resolveVariantFontsConfig(variantProps: any, styledObject: any) {
  let resolvedVariant = {};
  Object.keys(variantProps).forEach((variant) => {
    const variantValue = variantProps[variant];
    const variantObject = styledObject?.variants?.[variant]?.[variantValue];

    resolvedVariant = deepMerge(resolvedVariant, variantObject);
  });

  return resolvedVariant;
}

/* 
  process.env.STYLE_FONT_RESOLVER_STRATEGY= expo | web
  android / ios - font merge logic
  NextJS + web - web logic
  else (assuming it's expo) - Font merge logic
*/

function isExpoStrategy() {
  return !(
    (typeof window !== 'undefined' && //@ts-ignore
      window.next) ||
    process.env.STYLE_FONT_RESOLVER_STRATEGY === STYLE_FONT_RESOLVER_STRATEGY ||
    process.env.REACT_APP_STYLE_FONT_RESOLVER_STRATEGY ===
      STYLE_FONT_RESOLVER_STRATEGY ||
    process.env.STORYBOOK_STYLE_FONT_RESOLVER_STRATEGY ===
      STYLE_FONT_RESOLVER_STRATEGY ||
    process.env.NEXT_PUBLIC_STORYBOOK_STYLE_FONT_RESOLVER_STRATEGY ===
      STYLE_FONT_RESOLVER_STRATEGY
  );
}

interface FontPlugin {
  mapFonts?(style: any): any;
}

export class FontResolver implements IStyledPlugin, FontPlugin {
  name: 'FontHandler';
  styledUtils: IStyled | undefined = {};

  mapFonts(style: any) {
    if (isExpoStrategy()) {
      let fontFamilyValue = style.fontFamily
        .replace(/ /g, '')
        .replace(/^\w/, (c: any) => c.toUpperCase());

      if (style.fontWeight) {
        fontFamilyValue = `${fontFamilyValue}_${style.fontWeight}`;
        if (typeof style.fontWeight === 'string') {
          fontFamilyValue = `${fontFamilyValue}${
            fontWeights[style.fontWeight]
          }`;
        } else if (typeof style.fontWeight === 'number') {
          const fontWeightString = fontWeights[style.fontWeight];
          fontFamilyValue = `${fontFamilyValue}${fontWeightString}`;
        }
      } else {
        fontFamilyValue = `${fontFamilyValue}_400Regular`;
      }
      if (style.fontStyle && typeof style.fontStyle === 'string') {
        const fontStyle = style.fontStyle.replace(/^\w/, (c: any) =>
          c.toUpperCase()
        );
        fontFamilyValue = `${fontFamilyValue}_${fontStyle}`;
      }

      style.fontFamily = fontFamilyValue;

      this.#fontFamily = fontFamilyValue;

      delete style.fontWeight;
      delete style.fontStyle;
    }
  }

  register(styledUtils: any = {}) {
    if (this.styledUtils) {
      this.styledUtils.aliases = {
        ...this.styledUtils?.aliases,
        ...styledUtils?.aliases,
      };

      this.styledUtils.tokens = {
        ...this.styledUtils?.tokens,
        ...styledUtils?.tokens,
      };

      this.styledUtils.ref = styledUtils?.ref;
    }
  }

  constructor({
    styledUtils,
    mapFonts,
  }: {
    styledUtils?: IStyled;
    mapFonts?: FontPlugin['mapFonts'];
  } = {}) {
    this.register(styledUtils);
    this.name = 'FontHandler';
    this.mapFonts = mapFonts || this.mapFonts;
  }

  inputMiddleWare(styledObj: any = {}, shouldUpdate: boolean = true) {
    const modifiedStyledObject = this.fontHandler(styledObj, shouldUpdate);

    if (shouldUpdate) {
      return styledObj;
    }

    return modifiedStyledObject;
  }

  #fontFamily: any = {};

  #fontFamilyTokenConfig: any = {};

  #fontWeightsTokenConfig: any = {};

  fontHandler(
    styledObject: any = {},
    shouldUpdate: boolean,
    fontStyleObject: any = {},
    keyPath: string[] = []
  ) {
    for (const styledObjectKey in styledObject) {
      if (typeof styledObject[styledObjectKey] === 'object') {
        keyPath.push(styledObjectKey);

        this.fontHandler(
          styledObject[styledObjectKey],
          shouldUpdate,
          fontStyleObject,
          keyPath
        );
        keyPath.pop();
      } else if (shouldUpdate) {
        if (styledObjectKey === 'fontFamily') {
          setObjectKeyValue(
            this.#fontFamily,
            [...keyPath, styledObjectKey],
            styledObject[styledObjectKey]
          );
          delete styledObject[styledObjectKey];
        }
        if (styledObjectKey === 'fontWeight') {
          setObjectKeyValue(
            this.#fontFamily,
            [...keyPath, styledObjectKey],
            styledObject[styledObjectKey]
          );
          delete styledObject[styledObjectKey];
        }
        if (styledObjectKey === 'fontStyle') {
          setObjectKeyValue(
            this.#fontFamily,
            [...keyPath, styledObjectKey],
            styledObject[styledObjectKey]
          );
          delete styledObject[styledObjectKey];
        }
      } else if (styledObjectKey === 'fontFamily') {
        tokenizeFontsConfig(styledObject, {
          fontsTokens: this.#fontFamilyTokenConfig,
          fontWeightsTokens: this.#fontWeightsTokenConfig,
        });

        if (styledObject[styledObjectKey]) this.mapFonts(styledObject);
      }
    }

    return styledObject;
  }

  componentMiddleWare({ NewComp, extendedConfig }: any) {
    const styledConfig = this.#fontFamily;
    this.#fontFamily = {};

    const Comp = React.forwardRef((props: any, ref: any) => {
      const styledContext = useStyled();
      const CONFIG = useMemo(
        () => ({
          ...styledContext.config,
          propertyTokenMap,
        }),
        [styledContext.config]
      );
      let componentExtendedConfig = CONFIG;
      if (extendedConfig) {
        componentExtendedConfig = deepMerge(CONFIG, extendedConfig);
      }
      this.#fontFamilyTokenConfig = componentExtendedConfig?.tokens?.fonts;
      this.#fontWeightsTokenConfig =
        componentExtendedConfig?.tokens?.fontWeights;

      const { variantProps, restProps } = getVariantProps(
        props,
        styledConfig,
        false
      );

      const variantStyledObject = resolveVariantFontsConfig(
        variantProps,
        styledConfig
      );
      let componentStyledObject = deepMergeObjects(
        styledConfig,
        variantStyledObject
      );

      delete componentStyledObject.variants;

      const { sx, fontWeight, fontFamily, fontStyle, ...rest } = restProps;

      componentStyledObject = {
        ...componentStyledObject,
        fontWeight: fontWeight ?? componentStyledObject.fontWeight,
        fontFamily: fontFamily ?? componentStyledObject.fontFamily,
        fontStyle: fontStyle ?? componentStyledObject.fontStyle,
      };

      const sxPropsWithThemeProps = deepMergeObjects(componentStyledObject, sx);

      const resolvedSxProps = this.inputMiddleWare(
        sxPropsWithThemeProps,
        false
      );

      return <NewComp sx={resolvedSxProps} {...rest} ref={ref} />;
    });
    return Comp;
  }
}
