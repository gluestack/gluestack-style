import React, { Profiler } from 'react';

export const ProfilerComponent = ({
  index,
  testInfo,
  children,
}: {
  index: any;
  testInfo: string;
  children: React.ReactNode;
}) => {
  function handleProfilerData(
    id: string, // the "id" prop of the Profiler tree that has just committed
    phase: string, // either "mount" (if the tree just mounted) or "update" (if it re-rendered)
    actualDuration: number, // time spent rendering the committed update
    baseDuration: number, // estimated time to render the entire subtree without memoization
    startTime: number, // when React began rendering this update
    commitTime: number, // when React committed this update
    interactions: Set<any> // the Set of interactions belonging to this update
  ) {
    console.setKey(testInfo, parseFloat(actualDuration.toFixed(2)));
    console.log(parseFloat(actualDuration.toFixed(2)));
  }

  return (
    <>
      <Profiler key={index} id={testInfo} onRender={handleProfilerData}>
        {children}
      </Profiler>
    </>
  );
};
