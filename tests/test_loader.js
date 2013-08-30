for (var key in define.registry) {
  if (typeof key === 'string' && (/\_test/).test(key)) {
    requireModule(key);
  }
}
