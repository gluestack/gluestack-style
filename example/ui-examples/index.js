console.timeMap = { boot: {}, runtime: {} };
console.performanceMap = {};
console.initKey = (key: string, runningTime: string) => {
  console.timeMap[runningTime][key] = {
    'startTime': 0,
    'endTime': 0,
    'callCounter': 0,
    'render-time(ms)': 0,
  };
};

console.incrementCallCounter = (
  key?: string,
  runningTime?: string = 'runtime'
) => {
  console.timeMap[runningTime][key]['callCounter'] += 1;
};

console.startMount = (key: string, runningTime?: string = 'runtime') => {
  if (!console.timeMap[runningTime][key]) {
    console.initKey(key, runningTime);
  }
  console.incrementCallCounter(key, runningTime);
  console.timeMap[runningTime][key]['startTime'] = new Date().getTime();
};
console.endMount = (key: string, runningTime?: string = 'runtime') => {
  const endTime = new Date().getTime();
  const startTime = console.timeMap[runningTime][key]['startTime'];
  console.timeMap[runningTime][key]['endTime'] = endTime;
  console.timeMap[runningTime][key]['render-time(ms)'] = endTime - startTime;
};

console.getPerformanceReport = () => {
  // console.log('console.timeMap.boot');
  // console.table(console.timeMap.boot);
  console.log('console.timeMap.runtime');
  console.table(console.timeMap.runtime);
};

console.setKey = (key, time) => {
  if (console.performanceMap[key]) {
    console.performanceMap[key].push(time);
  } else {
    console.performanceMap[key] = [time];
  }
};

console.getPerformanceMap = () => {
  const performanceMap = console.performanceMap;

  Object.keys(performanceMap).map((library, index) => {
    performanceMap[library]['average'] = parseFloat(
      (
        performanceMap[library].reduce((prev, acc) => prev + acc, 0) /
        performanceMap[library].length
      ).toFixed(2)
    );
  });

  console.table(performanceMap);
};

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
