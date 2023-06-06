import { deepMerge, setObjectKeyValue } from './utils';
import {
  CSSPropertiesMap,
  // reservedKeys
} from './styled-system';

export const convertUtilityPropsToSX = (
  CONFIG: any,
  _descendants: any,
  propsWithUtility: any
) => {
  const sxPropsConvertedObj: any = {};
  const ignoredProps: any = {};

  const { sx, ...componentProps } = propsWithUtility;

  const styledSystemProps = {
    ...CSSPropertiesMap,
    ...CONFIG?.aliases,
  };

  Object.keys(componentProps).forEach((prop) => {
    if (styledSystemProps[prop]) {
      setObjectKeyValue(
        sxPropsConvertedObj,
        ['style', prop],
        componentProps[prop]
      );
    } else {
      if (prop !== 'dataSet') {
        ignoredProps[prop] = componentProps[prop];
      }
    }
  });

  return {
    sxProps: deepMerge(sxPropsConvertedObj, sx),
    mergedProps: ignoredProps,
  };
};
