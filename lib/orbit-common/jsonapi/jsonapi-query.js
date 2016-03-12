import Orbit from 'orbit/main';
const { pluralize } = Orbit;

export default class JSONAPIQuery {
  constructor(type, urlBuilder) {
    this._type = type;
    this._urlBuilder = urlBuilder;
    this._filter = {};
  }

  addFilter(filter) {
    Object.assign(this._filter, filter);

    return this;
  }

  build() {
    const queryString = this._buildQueryString();
    const path = this._urlBuilder.resourceURL(this._type);

    return queryString ? `${path}?${queryString}` : path;
  }

  _buildQueryString() {
    if (Object.keys(this._filter).length === 0) { return undefined; }

    const filterParams = Object.keys(this._filter).map(key => {
      const value = this._filter[key];
      return `filter[${key}]=${value}`;
    });

    return filterParams.join('&');
  }
}
