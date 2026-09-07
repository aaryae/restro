import { useCallback, useState, type FormEvent } from 'react'
import { hasErrors, type FieldErrors } from '@/lib/formValidation'

type UseFormStateOptions<T extends Record<string, unknown>, K extends string> = {
  initialValues: T
  validate: (values: T) => FieldErrors<K>
  onSubmit: (values: T) => void | Promise<void>
  /** Reset values when this key changes (e.g. modal open). */
  resetKey?: unknown
}

export function useFormState<
  T extends Record<string, unknown>,
  K extends string = Extract<keyof T, string>,
>({ initialValues, validate, onSubmit }: UseFormStateOptions<T, K>) {
  const [values, setValues] = useState<T>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<K>>({})
  const [formError, setFormError] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const reset = useCallback(
    (next: T = initialValues) => {
      setValues(next)
      setFieldErrors({})
      setFormError('')
      setTouched(false)
      setSubmitting(false)
    },
    [initialValues],
  )

  const setValue = useCallback(
    <Key extends keyof T>(key: Key, value: T[Key]) => {
      setValues((prev) => {
        const next = { ...prev, [key]: value }
        if (touched) setFieldErrors(validate(next))
        return next
      })
      if (formError) setFormError('')
    },
    [formError, touched, validate],
  )

  const patchValues = useCallback(
    (patch: Partial<T>) => {
      setValues((prev) => {
        const next = { ...prev, ...patch }
        if (touched) setFieldErrors(validate(next))
        return next
      })
      if (formError) setFormError('')
    },
    [formError, touched, validate],
  )

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault()
      setTouched(true)
      const nextErrors = validate(values)
      setFieldErrors(nextErrors)
      if (hasErrors(nextErrors)) {
        setFormError('Please fix the highlighted fields.')
        return
      }

      setFormError('')
      setSubmitting(true)
      try {
        await onSubmit(values)
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setSubmitting(false)
      }
    },
    [onSubmit, validate, values],
  )

  return {
    values,
    setValues,
    setValue,
    patchValues,
    fieldErrors,
    setFieldErrors,
    formError,
    setFormError,
    touched,
    submitting,
    setSubmitting,
    reset,
    handleSubmit,
    hasErrors: hasErrors(fieldErrors),
  }
}
