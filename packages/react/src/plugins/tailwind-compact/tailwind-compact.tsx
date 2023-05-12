import React, { useMemo } from 'react';
import type { IStyled, IStyledPlugin } from '../../createStyled';
import { propertyTokenMap } from '../../propertyTokenMap';
import { useStyled } from '../../StyledProvider';
import { deepMerge } from '../../utils';

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

  inputMiddleWare(tailwindClasses: any) {
    this.tailwindClassesToDankStyledObject(tailwindClasses);
  }

  tailwindClassesToDankStyledObject(tailwindClasses: string) {
    // const classes = tailwindClasses.split(' ');
    console.log(tailwindClasses, '_______');
  }

  componentMiddleWare({ NewComp, extendedConfig }: any) {
    return React.forwardRef((props: any, ref: any) => {
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

      return <NewComp ref={ref} {...props} />;
    });
  }
}
