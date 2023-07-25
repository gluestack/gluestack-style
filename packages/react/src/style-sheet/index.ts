import { Platform, StyleSheet } from 'react-native';
import { injectInStyle } from '../injectInStyle';
import type {
  GlobalStyleMap,
  OrderedSXResolved,
  StyledValueResolvedWithMeta,
} from '../types';
// import { isValidBreakpoint } from './is-valid-breakpoint';

export class StylesInjector {
  #globalStyleMap: GlobalStyleMap;
  #stylesMap: any;
  platform: any;

  constructor() {
    this.#globalStyleMap = new Map();
    this.#stylesMap = new Map();
    this.platform = Platform.OS;
  }

  update(
    orderedSXResolved: OrderedSXResolved,
    _wrapperElementId: string = '',
    _styleTagId: any = 'css-injected-boot-time'
  ) {
    let previousStyleMap: any = [];

    if (Array.isArray(this.#globalStyleMap.get(_wrapperElementId))) {
      previousStyleMap = this.#globalStyleMap.get(_wrapperElementId);
    }

    orderedSXResolved.forEach((styleResolved: StyledValueResolvedWithMeta) => {
      const styleData: any = {
        meta: {
          queryCondition: styleResolved?.meta?.queryCondition,
        },
      };

      if (this.platform === 'web') {
        styleData.value = styleResolved?.meta?.cssRuleset;
      } else {
        styleData.value = StyleSheet.create({
          [styleResolved.meta.cssId]: styleResolved?.resolved as any,
        });
      }

      let isStyleTagExist = false;
      if (previousStyleMap.length > 0) {
        previousStyleMap = previousStyleMap.map((value: any) => {
          return value?.map((styleTagIdObject: any) => {
            const styleTagIds = Object.keys(styleTagIdObject);

            const isStyleTagIdExist = styleTagIds.includes(_styleTagId);

            if (isStyleTagIdExist) {
              isStyleTagExist = true;
              styleTagIdObject?.[_styleTagId].push({
                [styleResolved.meta.cssId]: styleData,
              });
            }

            return styleTagIdObject;
          });
        });
      }

      if (!isStyleTagExist) {
        previousStyleMap.push([
          {
            [_styleTagId]: [
              {
                [styleResolved.meta.cssId]: styleData,
              },
            ],
          },
        ]);
      }
      this.#stylesMap.set(styleResolved.meta.cssId, styleData);
    });

    this.#globalStyleMap.set(_wrapperElementId, previousStyleMap);
  }

  getStyleMap() {
    // if (!cached) {
    //   this.#globalStyleMap.forEach((values: any) => {
    //     values.forEach((value: any) => {
    //       value?.forEach((currVal: any) => {
    //         const styleTagId = Object.keys(currVal)[0];

    //         const orderedResolved = currVal[styleTagId];

    //         Object.keys(orderedResolved)?.forEach((orderResolvedKey) => {
    //           const finalOrderResolved = Object.keys(
    //             orderedResolved[orderResolvedKey]
    //           )[0];

    //           // if (finalOrderResolved === cssId) {
    //           const styleSheetIds =
    //             orderedResolved[orderResolvedKey][finalOrderResolved]?.value;
    //           const queryCondition =
    //             orderedResolved[orderResolvedKey][finalOrderResolved]?.meta
    //               ?.queryCondition;

    //           const styleSheet = StyleSheet.flatten(
    //             Object.keys(styleSheetIds).map(
    //               (currentStyle) => styleSheetIds[currentStyle]
    //             )
    //           );

    //           this.#stylesMap[finalOrderResolved] = {
    //             meta: { queryCondition },
    //             value: styleSheet,
    //           };

    //           // if (queryCondition) {
    //           //   if (isValidBreakpoint(config, queryCondition)) {
    //           //     styleObj.push(styleSheet);
    //           //   }
    //           // } else {
    //           //   styleObj.push(styleSheet);
    //           // }
    //           // }
    //         });
    //       });
    //     });
    //   });
    // }

    // console.log(this.#stylesMap, '________');

    return this.#stylesMap;
  }

  injectInStyle() {
    const styleSheetInjectInStyle = injectInStyle.bind(this);

    styleSheetInjectInStyle(this.#globalStyleMap);
  }
}

const stylesheet = new StylesInjecter();

export const GluestackStyleSheet = {
  update: stylesheet.update.bind(stylesheet),
  injectInStyle: stylesheet.injectInStyle.bind(stylesheet),
  getStyleMap: stylesheet.getStyleMap.bind(stylesheet),
};
