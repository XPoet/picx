export function directoryBreadcrumbs(path: string): Array<{ name: string, path: string }> {
  const segments = path.split('/').filter(Boolean)
  return [{ name: '/', path: '/' }, ...segments.map((name, index) => ({ name, path: segments.slice(0, index + 1).join('/') }))]
}
