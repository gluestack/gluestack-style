import { IAnimationDriver } from './DriverInterface';
export class MotiDriver extends IAnimationDriver {
  SafeAreaView: any;
  constructor(ComponentRef: any) {
    super();
    this.register(ComponentRef);
  }

  register(ComponentRef: any) {
    this.ComponentRef = ComponentRef;
    this.View = ComponentRef.MotiView;
    this.Text = ComponentRef.MotiText;
    this.Image = ComponentRef.MotiImage;
    this.ScrollView = ComponentRef.MotiScrollView;
    this.SafeAreaView = ComponentRef.MotiSafeAreaView;
    // ...
  }
}
