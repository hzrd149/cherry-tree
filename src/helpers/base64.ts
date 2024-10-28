export function bytesToBase64(bytes: Uint8Array) {
  // @ts-expect-error
  return btoa(String.fromCharCode.apply(null, bytes));
}

export function base64ToBytes(base64: string) {
  return new Uint8Array(
    atob(base64)
      .split("")
      .map((c) => c.charCodeAt(0)),
  );
}
