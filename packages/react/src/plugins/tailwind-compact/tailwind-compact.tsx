import React, { useId, useMemo } from 'react';
import type { IStyled, IStyledPlugin } from '../../createStyled';
import { propertyTokenMap } from '../../propertyTokenMap';
import { useStyled } from '../../StyledProvider';
import { deepMerge, setObjectKeyValue } from '../../utils';
import { dankKeywords, core } from './utils';

const groupElementsGlobalMap: Map<string, any> = new Map<string, any>();

const resolvePsuedoSelectors = (className: string) => {
  const classes = className.split(':');
  const stlyedObjectKeys = [];

  // const [prop, ...value] = classes;

  for (const cls of classes) {
    if (dankKeywords[cls]) {
      stlyedObjectKeys.push(dankKeywords[cls]);
    } else {
      stlyedObjectKeys.push(cls);
    }
  }

  return stlyedObjectKeys;
};

const resolveClassToStyle = (className: string) => {
  const classname = resolvePsuedoSelectors(className);

  const originalProperty = classname.pop();
  const pseudoSelectors = classname;
  const [property, ...value] = originalProperty.split('-');

  const originalCSSProperty = core[property] ?? property;

  return {
    styledObjectKeys: originalCSSProperty
      ? [...pseudoSelectors, originalCSSProperty]
      : [],
    value: `$${value.join('')}`,
  };
};

export class Tailwind implements IStyledPlugin {
  name: 'Tailwind';
  styledUtils: IStyled | undefined = {};

  register(styledUtils: any) {
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
    // this.styledUtils = styledUtils;
  }

  constructor(styledUtils: IStyled) {
    this.register(styledUtils);
    this.name = 'Tailwind';
  }

  inputMiddleWare(styledObject: any) {
    const { className, ...rest } = styledObject;
    const classNameResolvedStyleObject =
      this.tailwindClassesToDankStyledObject(className);

    console.log(classNameResolvedStyleObject, 'classNameResolvedStyleObject');

    return deepMerge(rest, classNameResolvedStyleObject);
  }

  tailwindClassesToDankStyledObject(tailwindClasses: string) {
    const classes = tailwindClasses.split(' ');
    const styledObject = {};

    for (const cls of classes) {
      const { styledObjectKeys, value } = resolveClassToStyle(cls);

      console.log(styledObjectKeys, value, 'styledObjectKeys, value');

      if (styledObjectKeys.length !== 0)
        setObjectKeyValue(styledObject, styledObjectKeys, value);
    }
    return styledObject;
  }

  componentMiddleWare({ NewComp }: any) {
    return React.forwardRef((props: any, ref?: any) => {
      const { className, children, sx, ...restProps } = props;
      const classNameResolvedStyleObject = this.inputMiddleWare({
        className: className ?? '',
      });
      const id = useId();
      const updatedChildren = React.Children.map(children, (child) => {
        const clonedChildren = React.cloneElement(child, {
          ...child?.props,
          id: `tailwind-group-${id}`,
        });
        return clonedChildren;
      });

      console.log(updatedChildren, 'updatedChildren&&&&');
      // const styledContext = useStyled();
      // const CONFIG = useMemo(
      //   () => ({
      //     ...styledContext.config,
      //     propertyTokenMap,
      //   }),
      //   [styledContext.config]
      // );
      // let componentExtendedConfig = CONFIG;
      // if (extendedConfig) {
      //   componentExtendedConfig = deepMerge(CONFIG, extendedConfig);
      // }

      console.log(
        classNameResolvedStyleObject,
        className,
        'classNameResolvedStyleObject********'
      );

      return (
        <NewComp
          ref={ref}
          sx={{ ...classNameResolvedStyleObject, ...sx }}
          {...restProps}
          children={children}
        />
      );
    });
  }
}
