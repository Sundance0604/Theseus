export function assetUrl(fileName) {
  return `${import.meta.env.BASE_URL}${String(fileName).replace(/^\/+/, '')}`;
}

export function cssAssetUrl(fileName) {
  return `url("${assetUrl(fileName)}")`;
}
