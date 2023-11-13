import { RegisterOptions } from 'react-hook-form'
import type { Schema, StringValidation, MoneyValidation } from './types'
import { formatMoney, formatDate } from './serialize'

/**
 * Gets validation option for the type of schema field
 * @param fieldSchema schema of the field
 * @returns validation option to be used in `register` function of react-hook-forms {@link https://react-hook-form.com/api/useform/register#options}
 */
const rule = (fieldSchema: Schema): RegisterOptions => {
  const rule: RegisterOptions = {}

  if (fieldSchema.type === 'string') {
    if (!fieldSchema.conditions) {
      return rule
    }

    const conditions = fieldSchema.conditions as StringValidation

    if (conditions.regex) {
      rule.pattern = {
        value: new RegExp(conditions.regex),
        message: 'Pattern mismatch'
      }
    }
  } else if (fieldSchema.type === 'money') {
    rule.setValueAs = formatMoney
    rule.validate = (value) => (isNaN(value) ? 'Number required' : true)

    if (!fieldSchema.conditions) {
      return rule
    }

    const conditions = fieldSchema.conditions as MoneyValidation

    if (conditions.minValue !== undefined) {
      rule.min = {
        value: conditions.minValue,
        message: `Must be no less than $${conditions.minValue}`
      }
    }

    if (conditions.maxValue !== undefined) {
      rule.max = {
        value: conditions.maxValue,
        message: `Must be no greater than $${conditions.maxValue}`
      }
    }
  } else {
    // date
    rule.setValueAs = formatDate
  }

  return rule
}

export default rule
