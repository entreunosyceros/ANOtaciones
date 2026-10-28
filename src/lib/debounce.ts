export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number,
) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastArgs: Args | undefined

  const wrapped = ((...args: Args) => {
    lastArgs = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      if (!lastArgs) return
      fn(...lastArgs)
      lastArgs = undefined
    }, ms)
  }) as ((...args: Args) => void) & { flush: () => void; cancel: () => void }

  wrapped.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = undefined
    lastArgs = undefined
  }

  wrapped.flush = () => {
    if (!timer || !lastArgs) return
    clearTimeout(timer)
    timer = undefined
    const args = lastArgs
    lastArgs = undefined
    fn(...args)
  }

  return wrapped
}
