
export const merge = function(a: any = {}, b: any = {}){
  for (const key in b) {
    if (b[key] !== null && typeof b[key] === "object") {
      a[key] = merge(a[key], b[key]);
    } else {
      a[key] = b[key];
    }
  }

  return a;
};
