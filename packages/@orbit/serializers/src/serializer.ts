export interface Serializer<
  From,
  To,
  SerializationOptions,
  DeserializationOptions
> {
  serialize(arg: From, options?: SerializationOptions): To;
  deserialize(arg: To, options?: DeserializationOptions): From;
}

export type UnknownSerializer = Serializer<unknown, unknown, unknown, unknown>;
export type UnknownSerializerClass = new (
  options?: unknown
) => UnknownSerializer;
