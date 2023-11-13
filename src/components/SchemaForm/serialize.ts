import { FieldValues } from 'react-hook-form'
import type { Schema, StoreData, Money, Date } from './types'

/**
 * Parse money field of store and its return value is used in initial value of the form
 * @param value
 * @returns parsed value
 */
const parseMoney = (value: Money) => (value === null || value === undefined ? '' : value.toString())

/**
 * Parse date field of store and its return value is used in initial value of the form
 * @param value
 * @returns parsed value
 */
const parseDate = (value: Date) =>
  value === null || value === undefined
    ? ''
    : new Date(`${value.year}-${value.month}-${value.day}`).toISOString().slice(0, 10)

/**
 * Parse string field of store and its return value is used in initial value of the form
 * @param value
 * @returns parsed value
 */
const parseString = (value: string) => (value === undefined ? '' : value.toString())

/**
 * Format money field from the form and its return value will be saved in store after passing validation
 * @param value
 * @returns formated value
 */
export const formatMoney = (value: string) => {
  if (value === '') {
    return null
  } else if (parseFloat(value).toString() === value.toString()) {
    return Number(value)
  } else {
    return NaN
  }
}

/**
 * Format date field from the form and its return value will be saved in store
 * @param value
 * @returns formated value
 */
export const formatDate = (value: string) => {
  if (value === '') {
    return null
  } else {
    return {
      month: Number(value.slice(5, 7)),
      day: Number(value.slice(8)),
      year: Number(value.slice(0, 4))
    }
  }
}

/**
 * Take form value first, and current store value, and default blank value
 * @param formValue form value
 * @param currentStoreValue current store value
 * @param schema field schema
 * @returns final field value to be saved in store
 */
const pick = (formValue: any, currentStoreValue: any, schema: Schema) => {
  if (formValue !== undefined) {
    return formValue
  } else if (currentStoreValue !== undefined) {
    return currentStoreValue
  } else if (schema.type === 'string') {
    return ''
  } else {
    return null
  }
}

/**
 * Make value to be saved in store by merging current store data and form field values.
 *
 * If form value is undefined, it means the field is not validated from the form, hence won't be saved in the store.
 *
 * @param values form field values
 *
 * Each form field value can be:
 *
 * null: money or date is empty
 *
 * undefined: input is invalid, won't be saved in the store
 * @param currentStoreData current store data
 * @param schema form schema
 * @returns serialized value
 */
export const serialize = (
  values: FieldValues,
  currentStoreData: FieldValues | undefined,
  schema: Schema[]
) => {
  const data = {} as StoreData

  schema.forEach((s) => {
    const entity = data[s.entity]
    const value = pick(
      values[s.field],
      currentStoreData === undefined ? undefined : currentStoreData[s.field],
      s
    )

    if (entity === undefined) {
      data[s.entity] = { [s.field]: value }
    } else {
      entity[s.field] = value
    }
  })

  return JSON.stringify(data)
}

/**
 * Make value to be used as initial value of the form from the store data
 * 
 * It fills all missing fields with default value (null or empty string)
 *
 * Return `undefined` will be used as blank initial value
 * @note It takes care of any incorrect data from the store
 * @param rawData store data
 * @param schema form schema
 * @returns initial value of the form
 */
export const deserialize = (rawData: string, schema: Schema[]) => {
  try {
    const data: StoreData = JSON.parse(rawData)
    const value = {} as { [key: string]: string }

    schema.forEach((s) => {
      const entity = data[s.entity]

      if (entity === undefined) {
        value[s.field] = ''
      } else {
        const val = entity[s.field]
        try {
          switch (s.type) {
            case 'date':
              value[s.field] = parseDate(val as Date)
              return
            case 'money':
              value[s.field] = parseMoney(val as Money)
              return
            case 'string':
            default:
              value[s.field] = parseString(val as string)
              return
          }
        } catch {
          value[s.field] = ''
        }
      }
    })

    return value
  } catch {
    console.error('store data is not json format')
    return undefined
  }
}
