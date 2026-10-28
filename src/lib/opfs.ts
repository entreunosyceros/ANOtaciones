/** OPFS helpers for attachments. Falls back to memory Map in tests / unsupported browsers. */

const memory = new Map<string, Blob>()

async function root(): Promise<FileSystemDirectoryHandle | null> {
  try {
    if (!('storage' in navigator) || !navigator.storage?.getDirectory) return null
    return await navigator.storage.getDirectory()
  } catch {
    return null
  }
}

export async function writeOpfsBlob(path: string, blob: Blob): Promise<void> {
  const dir = await root()
  if (!dir) {
    memory.set(path, blob)
    return
  }
  const parts = path.split('/').filter(Boolean)
  let current = dir
  for (let i = 0; i < parts.length - 1; i++) {
    current = await current.getDirectoryHandle(parts[i]!, { create: true })
  }
  const fileHandle = await current.getFileHandle(parts[parts.length - 1]!, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
}

export async function readOpfsBlob(path: string): Promise<Blob | null> {
  if (memory.has(path)) return memory.get(path)!
  const dir = await root()
  if (!dir) return null
  try {
    const parts = path.split('/').filter(Boolean)
    let current = dir
    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i]!)
    }
    const fileHandle = await current.getFileHandle(parts[parts.length - 1]!)
    return await fileHandle.getFile()
  } catch {
    return null
  }
}

export async function deleteOpfsBlob(path: string): Promise<void> {
  memory.delete(path)
  const dir = await root()
  if (!dir) return
  try {
    const parts = path.split('/').filter(Boolean)
    let current = dir
    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i]!)
    }
    await current.removeEntry(parts[parts.length - 1]!)
  } catch {
    /* ignore */
  }
}

export function opfsPathFor(attachmentId: string, filename: string): string {
  const safe = filename.replace(/[^\w.\-]+/g, '_')
  return `attachments/${attachmentId}-${safe}`
}

/** Test helper */
export function clearOpfsMemory(): void {
  memory.clear()
}
