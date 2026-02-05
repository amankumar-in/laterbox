import type { AttachmentResult } from '@/hooks/useAttachmentHandler'

type ContactCallback = (result: AttachmentResult) => void

let _callback: ContactCallback | null = null

export function setContactPickerCallback(cb: ContactCallback) {
  _callback = cb
}

export function getContactPickerCallback(): ContactCallback | null {
  return _callback
}

export function clearContactPickerCallback() {
  _callback = null
}
