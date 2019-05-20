export default interface IdentitySerializer<Identity> {
  serialize(identity: Identity): string;
  deserialize(identifier: string): Identity;
}
