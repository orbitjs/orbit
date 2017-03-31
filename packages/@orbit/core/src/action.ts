export interface Action {
  type: string;
  id?: string;
  data?: any;
}

export interface Actionable {
  perform(action: Action): Promise<any>;
}
