export interface IViettelInvoice {
  export(request: any): Promise<any>;
  cancel(request: any): Promise<any>;
  update(request: any): Promise<any>;
  getDetail(request: any): Promise<any>;
  login(request: any): Promise<any>;
}
