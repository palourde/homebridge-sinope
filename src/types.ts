export interface SinopeDevice {
  id: number;
  identifier: string;
  name: string;
  parentDevice$id?: number;
  sku: string;
  vendor: string;
}