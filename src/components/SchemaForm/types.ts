export type MoneyValidation = { maxValue?: number; minValue?: number }

export type StringValidation = { regex?: string }

export interface Schema {
  entity: 'Loan' | 'Borrower'
  display: string
  field: string
  type: 'string' | 'money' | 'date'
  conditions?: MoneyValidation | StringValidation
}

export type Entity = {
  [key: string]: string | Money | Date
}

export type StoreData = {
  Loan?: Entity
  Borrower?: Entity
}

export type Money = number | null

export type Date = { month: number; day: number; year: number } | null
