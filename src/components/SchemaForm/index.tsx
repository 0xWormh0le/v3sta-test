import React, { useCallback } from 'react'
import { FieldError, ChangeHandler, FieldValues, useForm } from 'react-hook-form'
import type { Schema } from './types'
import validateOption from './validate'

export * from './serialize'
export * from './types'

interface SchemaFormProps {
  schema: Schema[]
  title: string
  saveToStore?: (values: FieldValues) => void
  defaultValues?: { [key: string]: string }
  className?: string
}

const SchemaForm: React.FC<SchemaFormProps> = ({
  schema,
  title,
  saveToStore,
  defaultValues,
  className
}) => {
  const {
    register,
    getValues,
    getFieldState,
    formState: { errors }
  } = useForm({ mode: 'onTouched', defaultValues })

  const handleInputBlur = useCallback(
    (onBlur: ChangeHandler, name: string): React.FocusEventHandler<HTMLInputElement> =>
      (e) => {
        // need to execute onBlur passed from react hook form to trigger validation
        onBlur(e).then(() => {
          const { error } = getFieldState(name)
          if (error === undefined && saveToStore) {
            const values = getValues()
            // save only validated values
            const validValues = Object.keys(values)
              .filter((field) => errors[field] === undefined)
              .reduce((validValues, field) => ({ ...validValues, [field]: values[field] }), [])
            saveToStore(validValues)
          }
        })
      },
    [getValues, saveToStore, getFieldState, errors]
  )

  return (
    <form aria-label="schema-form" className={className}>
      <p className="text-2xl mb-6">{title}</p>
      {schema.map((fieldSchema, key) => {
        const { onBlur, ...other } = register(fieldSchema.field, validateOption(fieldSchema))
        return (
          <div key={key} className="mt-2">
            <label htmlFor={fieldSchema.field} className="block">
              {fieldSchema.display}
            </label>
            <input
              {...other}
              onBlur={handleInputBlur(onBlur, other.name)}
              id={fieldSchema.field}
              data-testid={fieldSchema.field}
              type={fieldSchema.type === 'date' ? 'date' : 'text'}
              className="p-1 w-full"
            />
            {errors[fieldSchema.field] && (
              <small className="text-red-600 block" data-testid={`error-${fieldSchema.field}`}>
                {(errors[fieldSchema.field] as FieldError).message}
              </small>
            )}
          </div>
        )
      })}
    </form>
  )
}

export default SchemaForm
