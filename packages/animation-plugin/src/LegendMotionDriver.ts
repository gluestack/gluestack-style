import { IAnimationDriver } from './DriverInterface';
export class LegendMotionDriver extends IAnimationDriver {
  FlatList: any;
  SectionList: any;
  Pressable: any;
  AnimatePresence: any;
  LinearGradient: any;
  Svg: any;

  constructor(ComponentRef: any) {
    super();
    this.register(ComponentRef);
    // ...
  }

  register(ComponentRef: any) {
    this.ComponentRef = ComponentRef;
    this.View = ComponentRef.Motion.View;
    this.Text = ComponentRef.Motion.Text;
    this.FlatList = ComponentRef.Motion.FlatList;
    this.Image = ComponentRef.Motion.Image;
    this.ScrollView = ComponentRef.Motion.ScrollView;
    this.SectionList = ComponentRef.Motion.SectionList;
    this.Pressable = ComponentRef.Motion.Pressable;
    this.AnimatePresence = ComponentRef.AnimatePresence;
    // ...
  }
}
