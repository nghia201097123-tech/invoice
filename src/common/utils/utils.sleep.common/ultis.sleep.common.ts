export class UtilSleep {
  static delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
