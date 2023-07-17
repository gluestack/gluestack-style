/* do not change this file, it is auto generated by storybook. */

import {
  configure,
  addDecorator,
  addParameters,
  addArgsEnhancer,
  clearDecorators,
} from '@storybook/react-native';

import '@storybook/addon-ondevice-notes/register';
import '@storybook/addon-ondevice-controls/register';
import '@storybook/addon-ondevice-backgrounds/register';
import '@storybook/addon-ondevice-actions/register';

import { argsEnhancers } from '@storybook/addon-actions/dist/modern/preset/addArgs';

import { decorators, parameters } from './preview';

if (decorators) {
  if (__DEV__) {
    // stops the warning from showing on every HMR
    require('react-native').LogBox.ignoreLogs([
      '`clearDecorators` is deprecated and will be removed in Storybook 7.0',
    ]);
  }
  // workaround for global decorators getting infinitely applied on HMR, see https://github.com/storybookjs/react-native/issues/185
  clearDecorators();
  decorators.forEach((decorator) => addDecorator(decorator));
}

if (parameters) {
  addParameters(parameters);
}

try {
  argsEnhancers.forEach((enhancer) => addArgsEnhancer(enhancer));
} catch {}

const getStories = () => {
  return [
    // require('../src/overview/API'),
    // require('../src/components/Test/Test.stories.tsx'),

    // require('../src/hooks/Example.stories.tsx'),

    // require('../src/recipes/BaseStyle/BaseStyle.stories.tsx'),
    // require('../src/recipes/BaseStyleSX/BaseStyleSX.stories.tsx'),
    require('../src/api/ColorModeBasedStyles/ColorMode.stories.tsx'),
    require('../src/api/Variants/BaseStyleVariantSizes.stories.tsx'),
    require('../src/api/AsForwarder/AsForwarder.stories.tsx'),
    // require('../src/recipes/ButtonSizes/ButtonSizes.stories.tsx'),
    // require('../src/recipes/ButtonStateProps/ButtonStateProps.stories.tsx'),
    // require('../src/recipes/ButtonVariant/ButtonVariant.stories.tsx'),
    // require('../src/api/ColorModeBasedStyles/ColorMode.stories.tsx'),
    require('../src/api/DescendantsStyles/ContextBasedStyles.stories.tsx'),
    // require('../src/recipes/Icons/Icons.stories.tsx'),
    // require('../src/recipes/LinearGradient/LinearGradient.stories.tsx'),
    // require('../src/recipes/MediaQuery/MediaQuery.stories.tsx'),
    // require('../src/recipes/PlatformProps/PlatformProps.stories.tsx'),
    // require('../src/recipes/PropertyResolver/PropertyResolver.stories.tsx'),
    // require('../src/recipes/PropertyTokenMap/PropertyTokenMap.stories.tsx'),
    // require('../src/recipes/ResolveProps/ResolveProps.stories.tsx'),
    // require('../src/recipes/StateColorMode/StateColorMode.stories.tsx'),
    // require('../src/recipes/StateMediaQuery/StateMediaQuery.stories.tsx'),
    // require('../src/recipes/StatePlatform/StatePlatform.stories.tsx'),
    // require('../src/recipes/StyleId/StyleId.stories.tsx'),
    // require('../src/recipes/SxProps/SxProps.stories.tsx'),
    // require('../src/recipes/UtilityProps/UtilityProps.stories.tsx'),

    // require('../components/Icon/Icon.stories.tsx'),

    // require('../components/Icon/Icon.stories.tsx'),
    // require('../components/Pressable/Pressable.stories.tsx'),
    // require('../components/FormControl/FormControl.stories.tsx'),
    // require('../components/Icons/Icons.stories.tsx'),
    // require('../components/Avatar/Avatar.stories.tsx'),
    // require('../components/Button/Button.stories.tsx'),
    // require('../components/Center/Center.stories.tsx'),
    // require('../components/Switch/Switch.stories.tsx'),
    // require('../components/Checkbox/Checkbox.stories.tsx'),
    // require('../components/Heading/Heading.stories.tsx'),
    // require('../components/HStack/HStack.stories.tsx'),
    // require('../components/Image/Image.stories.tsx'),
    // require('../components/Input/Input.stories.tsx'),
    // require('../components/Image/Image.stories.tsx'),
    // require('../components/Modal/Modal.stories.tsx'),
    // require('../components/Slider/Slider.stories.tsx'),
    // require('../components/Badge/Badge.stories.tsx'),
    // require('../components/Divider/Divider.stories.tsx'),
    // require('../components/AlertDialog/AlertDialog.stories.tsx'),
    // require('../components/Fab/Fab.stories.tsx'),
    // require('../components/IconButton/IconButton.stories.tsx'),
    // require('../components/Progress/Progress.stories.tsx'),
  ];
};

configure(getStories, module, false);
