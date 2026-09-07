import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { FormAlert } from '@/components/ui/FormAlert'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { requiredText } from '@/lib/formValidation'

export type CafeActionKind =
  | 'activate'
  | 'unsuspend'
  | 'extend'
  | 'suspend'
  | 'impersonate'

type Props = {
  open: boolean
  action: CafeActionKind | null
  cafeName: string
  busy?: boolean
  onClose: () => void
  onConfirm: (notes?: string) => void
}

const COPY: Record<
  CafeActionKind,
  { title: string; body: string; confirm: string; danger?: boolean }
> = {
  activate: {
    title: 'Activate cafe?',
    body: 'This will set the cafe to active and restore normal access. The owner will receive an email that their cafe has been activated.',
    confirm: 'Activate',
  },
  unsuspend: {
    title: 'Unsuspend cafe?',
    body: 'This will lift the suspension and restore access. The owner will receive an email that their cafe has been restored.',
    confirm: 'Unsuspend',
  },
  extend: {
    title: 'Extend trial?',
    body: 'This will extend the trial by 7 days. The owner will receive an email with the new trial end date.',
    confirm: 'Extend trial',
  },
  suspend: {
    title: 'Suspend cafe?',
    body: 'This will block access for the cafe and email the owner. Add a note explaining why.',
    confirm: 'Suspend',
    danger: true,
  },
  impersonate: {
    title: 'Open POS?',
    body: 'This opens the cafe POS in a new tab using a temporary platform session.',
    confirm: 'Open POS',
  },
}

export function CafeActionConfirmModal({
  open,
  action,
  cafeName,
  busy = false,
  onClose,
  onConfirm,
}: Props) {
  const [notes, setNotes] = useState('')
  const [notesError, setNotesError] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setNotes('')
    setNotesError('')
    setError('')
  }, [open, action])

  if (!open || !action) return null

  const copy = COPY[action]

  function handleConfirm() {
    if (action === 'suspend') {
      const notesMsg = requiredText(notes, 'Notes', 5)
      setNotesError(notesMsg)
      if (notesMsg) {
        setError('Please fix the highlighted fields.')
        return
      }
      setError('')
      onConfirm(notes.trim())
      return
    }
    onConfirm()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.title}
      description={
        <>
          <span className="font-medium text-slate-700">{cafeName}</span>
          {' — '}
          {copy.body}
        </>
      }
      size="sm"
      busy={busy}
      showClose={false}
      footer={
        <ModalActions className="w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={copy.danger ? 'danger' : 'primary'}
            loading={busy}
            onClick={handleConfirm}
          >
            {busy ? 'Working…' : copy.confirm}
          </Button>
        </ModalActions>
      }
    >
      <div className="space-y-3">
        {action === 'suspend' ? (
          <Textarea
            label="Notes"
            required
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value)
              if (notesError) {
                setNotesError(requiredText(e.target.value, 'Notes', 5))
              }
              if (error) setError('')
            }}
            rows={4}
            placeholder="Why is this cafe being suspended?"
            error={notesError}
            autoFocus
          />
        ) : null}
        <FormAlert>{error}</FormAlert>
      </div>
    </Modal>
  )
}
