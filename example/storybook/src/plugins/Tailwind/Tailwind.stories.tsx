import type { ComponentMeta } from '@storybook/react-native';
import { Tailwind } from './Tailwind';
const MyTailwindMeta: ComponentMeta<typeof Tailwind> = {
  title: 'plugins/stories/Tailwind',
  component: Tailwind,
};

export { Tailwind } from './Tailwind';
export default MyTailwindMeta;
