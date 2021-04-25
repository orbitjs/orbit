export interface Serializer<
  From = unknown,
  To = unknown,
  SerializationOptions = unknown,
  DeserializationOptions = unknown
> {
  serialize(arg: From, options?: SerializationOptions): To;
  deserialize(arg: To, options?: DeserializationOptions): From;
}

export type SerializerClass<S = Serializer> = new (settings?: unknown) => S;
