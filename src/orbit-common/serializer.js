export default class Serializer {
  constructor(network) {
    // TODO: remove network
    this.network = network;
    this.keyMap = network.keyMap;
    this.schema = network.schema;
  }
}
