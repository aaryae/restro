import * as yup from 'yup'
import { normalizeCafeSlug } from '@/lib/cafe-slug'

const usernameSchema = yup
  .string()
  .trim()
  .transform((value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, ''),
  )
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username is too long')
  .matches(
    /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/,
    'Use letters, numbers, and . _ - only',
  )
  .required('Username is required')

const passwordSchema = yup
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(72, 'Password is too long')
  .required('Password is required')

export const loginSchema = yup.object({
  login: yup
    .string()
    .trim()
    .min(3, 'Enter your username or email')
    .required('Username or email is required'),
  password: passwordSchema,
  cafeSlug: yup
    .string()
    .transform((value) => normalizeCafeSlug(value || ''))
    .test('optional-cafe-slug', function validateOptionalCafeSlug(value) {
      if (!value) return true
      if (value.length < 2) {
        return this.createError({ message: 'Cafe ID must be at least 2 characters' })
      }
      if (value.length > 63) {
        return this.createError({ message: 'Cafe ID is too long' })
      }
      if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)) {
        return this.createError({
          message: 'Use lowercase letters, numbers, and hyphens',
        })
      }
      return true
    })
    .optional()
    .default(''),
})

export const registerSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name is too long')
    .required('Name is required'),
  username: usernameSchema,
  email: yup
    .string()
    .trim()
    .email('Enter a valid email address')
    .required('Email is required'),
  password: passwordSchema,
})

export const otpSchema = yup.object({
  otp: yup
    .string()
    .trim()
    .matches(/^\d{6}$/, 'Enter the 6-digit code')
    .required('Verification code is required'),
})

const loginIdSchema = yup
  .string()
  .trim()
  .min(3, 'Enter your username or email')
  .required('Username or email is required')

export const forgotSchema = yup.object({
  login: loginIdSchema,
})

export const resetPasswordSchema = yup.object({
  login: loginIdSchema,
  otp: yup
    .string()
    .trim()
    .matches(/^\d{6}$/, 'Enter the 6-digit code')
    .required('Verification code is required'),
  newPassword: passwordSchema,
  confirmPassword: yup
    .string()
    .required('Confirm your new password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
})

export async function validateForm(schema, values) {
  try {
    const data = await schema.validate(values, { abortEarly: false, stripUnknown: true })
    return { ok: true, data, errors: {} }
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      const errors = {}
      for (const issue of err.inner) {
        if (issue.path && !errors[issue.path]) {
          errors[issue.path] = issue.message
        }
      }
      if (err.path && !errors[err.path]) {
        errors[err.path] = err.message
      }
      return { ok: false, data: null, errors }
    }
    throw err
  }
}

/** Validate a single field without requiring the rest of the form. */
export async function validateField(schema, field, values) {
  try {
    await schema.validateAt(field, values)
    return ''
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      return err.message || ''
    }
    throw err
  }
}
