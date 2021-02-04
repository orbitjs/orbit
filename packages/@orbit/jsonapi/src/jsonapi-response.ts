import { ResourceDocument } from './resource-document';

export interface JSONAPIResponse {
  response: Response;
  document?: ResourceDocument;
}
