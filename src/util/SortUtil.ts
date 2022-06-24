export class SortUtil {
  static sortJSON<T>(json: T): T {
    const keys = Object.keys(json);
    keys.sort();

    const newJSON = {};
    for (const key of keys) {
      newJSON[key] = json[key];
    }

    return newJSON as T;
  }
}
