export interface Serializer<From, To> {
  serialize(arg: From): To;
  deserialize(arg: To): From;
}
