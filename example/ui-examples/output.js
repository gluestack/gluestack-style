'use strict';

var myConfig = {
  MyConfigOverride: 'some-other-value',
  MyConfigOverrideANd: 'some-other-value',
};

const newConfig = {
  ...myConfig,
  MyConfigOverride: 'some-value',
};

module.exports = newConfig;
