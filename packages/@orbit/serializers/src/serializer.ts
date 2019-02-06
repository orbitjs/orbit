export interface Serializer<From, To> {
  serialize(arg: From, options?: any): To;
  deserialize(arg: To, options?: any): From;
}
