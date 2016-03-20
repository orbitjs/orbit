function getPath(object, path) {
  return path.reduce((reference, property) => {
    return reference && reference[property];
  }, object);
}

class ValueMatcher {
  constructor(path, value) {
    this.path = path;
    this.value = value;
  }

  matches(object) {
    const value = getPath(object, this.path);
    return value === this.value;
  }
}

class ValuesMatcher {
  constructor(path, values) {
    this.path = path;
    this.values = values;
  }

  matches(object) {
    const value = getPath(object, this.path);
    return this.values.indexOf(value) !== -1;
  }
}

function isString(value) {
  return (typeof value === 'string');
}

const { isArray } = Array;

class PatternMatcher {
  constructor(pattern) {
    this._matchers = [];
    this._buildMatchers(pattern);
  }

  matches(object) {
    return this._matchers.every(pathMatcher => pathMatcher.matches(object));
  }

  _buildMatchers(pattern, currentPath = []) {
    if (isString(pattern) || !pattern) { return this._addValueMatcher(currentPath, pattern) };
    if (isArray(pattern)) { return this._addValuesMatcher(currentPath, pattern) };

    Object.keys(pattern).forEach(key => {
      let subPattern = pattern[key];
      this._buildMatchers(subPattern, [...currentPath, key]);
    });
  }

  _addValueMatcher(path, value) {
    this._matchers.push(new ValueMatcher(path, value));
  }

  _addValuesMatcher(path, values) {
    this._matchers.push(new ValuesMatcher(path, values));
  }
}

export function buildPatternMatcher(pattern) {
  const matcher = new PatternMatcher(pattern);
  return matcher.matches.bind(matcher);
}

