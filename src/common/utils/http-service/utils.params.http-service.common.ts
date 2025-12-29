/**
 *
 */
export class UtilsParamHttpService {
  params: any;
  url?: string;

  constructor(params: any, url?: string) {
    this.params = params;
    this.url = url;
  }

  public getUrl(): string {
    let urlString: string = this.url;
    let query: string = "";
    for (const property in this.params) {
      let key: string = `${property}`;
      let value: any = `${this.params[property]}`;
      query = query + `${key}=${value}&`;
    }
    urlString = `${urlString}?${query}`;
    return urlString;
  }

  public getUrlSingleParam(): string {
    let urlString: string = this.url;
    let query: string = "";
    for (const property in this.params) {
      let key: string = `${property}`;
      let value: any = `${this.params[property]}`;
      query = query + `${key}=${value}`;
    }
    urlString = `${urlString}?${query}`;
    return urlString;
  }

  public getData(): any {
    let data: any = {};
    for (const property in this.params) {
      let key: string = `${property}`;
      let value: any = `${this.params[property]}`;
      data[`${key}`] = value;
    }
    return data;
  }
}
