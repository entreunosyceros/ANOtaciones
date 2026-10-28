import { addAttachmentMeta } from '../db'
import { createId } from './id'
import { opfsPathFor, writeOpfsBlob } from './opfs'

/** Store a file in OPFS (or memory fallback) and register metadata. Returns object URL for editor. */
export async function storeAttachment(
  pageId: string,
  file: File,
): Promise<{ url: string; id: string }> {
  const id = createId()
  const path = opfsPathFor(id, file.name)
  await writeOpfsBlob(path, file)
  await addAttachmentMeta({
    id,
    pageId,
    name: file.name,
    mime: file.type || 'application/octet-stream',
    opfsPath: path,
    size: file.size,
    createdAt: Date.now(),
  })
  const url = URL.createObjectURL(file)
  return { url, id }
}
