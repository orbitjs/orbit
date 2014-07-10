for (var key in define.registry) {
  if (typeof key === 'string' && (/\-test/).test(key)) {
    requireModule(key);
  }
}
