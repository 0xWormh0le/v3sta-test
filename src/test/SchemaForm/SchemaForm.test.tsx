import renderer from 'react-test-renderer'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import SchemaForm, { StoreData, Schema, Entity } from 'components/SchemaForm'
import App, { saveToStore, loadStore } from 'App'
import MockLocalStorage from 'test/mocks/LocalStorage'
import schemaNoValidation from 'test/schema/test.json'
import config from 'assets/schema.json'

const schema = config as Schema[]

const mockLocalStorage = new MockLocalStorage()

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage
})

const log = jest.spyOn(console, 'log')
jest.spyOn(console, 'error')

const inputAndBlur = (fieldId: string, value: string) => {
  const input = screen.getByTestId(fieldId)

  input.focus()
  fireEvent.change(input, {
    target: { value }
  })
  input.blur()
}

describe('SchemaForm', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<App />).toJSON()
    render(<SchemaForm title="Sample Form" schema={schema} saveToStore={saveToStore} />)

    expect(screen.getByTestId('loanAmount')).toBeInTheDocument()
    expect(screen.getByTestId('downPaymentAmount')).toBeInTheDocument()
    expect(screen.getByTestId('firstName')).toBeInTheDocument()
    expect(screen.getByTestId('lastName')).toBeInTheDocument()
    expect(screen.getByTestId('birthDate')).toBeInTheDocument()

    expect(tree).toMatchSnapshot('initial render')
  })

  describe('validation', () => {
    it('money validation fails: not number', async () => {
      render(<SchemaForm title="Sample Form" schema={schema} saveToStore={saveToStore} />)
      inputAndBlur('loanAmount', 'text is not number')
      await waitFor(() => {
        expect(screen.getByTestId('error-loanAmount')).toHaveTextContent('Number required')
      })
      expect(log).not.toHaveBeenCalled()
    })

    it('money validation fails: min', async () => {
      render(<SchemaForm title="Sample Form" schema={schema} saveToStore={saveToStore} />)
      inputAndBlur('loanAmount', '123')
      await waitFor(() => {
        expect(screen.getByTestId('error-loanAmount')).toHaveTextContent('Must be no less than')
      })
      expect(log).not.toHaveBeenCalled()
    })

    it('money validation fails: max', async () => {
      render(<SchemaForm title="Sample Form" schema={schema} saveToStore={saveToStore} />)
      inputAndBlur('loanAmount', '99999999999')
      await waitFor(() => {
        expect(screen.getByTestId('error-loanAmount')).toHaveTextContent('Must be no greater than')
      })
      expect(log).not.toHaveBeenCalled()
    })

    it('string validation fails: pattern mismatch', async () => {
      render(<SchemaForm title="Sample Form" schema={schema} saveToStore={saveToStore} />)
      inputAndBlur('firstName', 'invalid pattern 123')
      await waitFor(() => {
        expect(screen.getByTestId('error-firstName')).toHaveTextContent('Pattern mismatch')
      })
      expect(log).not.toHaveBeenCalled()
    })

    it('schema with optional validation', async () => {
      render(
        <SchemaForm
          title="Sample Form"
          schema={schemaNoValidation as Schema[]}
          saveToStore={saveToStore}
        />
      )
      inputAndBlur('firstName', 'number 123 is acceptable')
      inputAndBlur('loanAmount', '123')
      await waitFor(() => {
        expect(log).toHaveBeenCalled()
      })
      expect(screen.queryByTestId('error-firstName')).not.toBeInTheDocument()
    })
  })

  describe('save to store', () => {
    it('empty money and date will save to null', async () => {
      render(<SchemaForm title="Sample Form" schema={schema} saveToStore={saveToStore} />)

      inputAndBlur('loanAmount', '')
      inputAndBlur('birthDate', '')

      await waitFor(() => {
        expect(log).toHaveBeenCalled()
      })

      const data = JSON.parse(localStorage.getItem('form-data') as string)

      expect(data.Loan.loanAmount).toBe(null)
      expect(data.Borrower.birthDate).toBe(null)
    })

    it('save only validated inputs and store will keep original value for unvalidated inputs', async () => {
      render(<SchemaForm title="Sample Form" schema={schema} saveToStore={saveToStore} />)

      localStorage.setItem('form-data', JSON.stringify({ Loan: { loanAmount: '11111' }}))

      inputAndBlur('loanAmount', 'invalid string input')

      await waitFor(() => {
        expect(screen.getByTestId('error-loanAmount')).toHaveTextContent('Number required')
      })

      inputAndBlur('firstName', 'foo')

      await waitFor(() => {
        expect(log).toHaveBeenCalledTimes(1)
      })

      const data: StoreData = JSON.parse(localStorage.getItem('form-data') as string)

      expect((data.Loan as Entity).loanAmount).toBe('11111')
      expect((data.Borrower as Entity).firstName).toBe('foo')
    })

    it('save only validated inputs and unvalidated inputs will be saved as blank if the store doesn\'t include them', async () => {
      render(<SchemaForm title="Sample Form" schema={schema} saveToStore={saveToStore} />)

      localStorage.clear()

      inputAndBlur('firstName', 'invalid name 123')

      await waitFor(() => {
        expect(screen.getByTestId('error-firstName')).toHaveTextContent('Pattern mismatch')
      })

      inputAndBlur('loanAmount', '111111')

      await waitFor(() => {
        expect(log).toHaveBeenCalledTimes(1)
      })

      const data = JSON.parse(localStorage.getItem('form-data') as string)

      expect((data.Loan as Entity).loanAmount).toBe(111111)
      expect((data.Loan as Entity).downPaymentAmount).toBe(null)
    })

    it('save to local storage on blur', async () => {
      render(<SchemaForm title="Sample Form" schema={schema} saveToStore={saveToStore} />)

      inputAndBlur('loanAmount', '11111')
      inputAndBlur('firstName', 'foo')
      inputAndBlur('lastName', 'bar')
      inputAndBlur('birthDate', '2022-12-11')

      await waitFor(() => {
        expect(log).toHaveBeenCalled()
      })

      const data: StoreData = JSON.parse(localStorage.getItem('form-data') as string)

      expect((data.Loan as Entity).loanAmount).toBe(11111)
      expect((data.Loan as Entity).downPaymentAmount).toBe(null)
      expect((data.Borrower as Entity).firstName).toBe('foo')
      expect((data.Borrower as Entity).lastName).toBe('bar')
      expect((data.Borrower as Entity).birthDate).toEqual({
        day: 11,
        month: 12,
        year: 2022
      })
    })
  })

  describe('load from store', () => {
    it('load from local storage', async () => {
      render(
        <SchemaForm
          title="Sample Form"
          schema={schema}
          saveToStore={saveToStore}
          defaultValues={loadStore()}
        />
      )

      expect(screen.getByTestId('loanAmount')).toHaveValue('11111')
      expect(screen.getByTestId('downPaymentAmount')).toHaveValue('')
      expect(screen.getByTestId('firstName')).toHaveValue('foo')
      expect(screen.getByTestId('lastName')).toHaveValue('bar')
      expect(screen.getByTestId('birthDate')).toHaveValue('2022-12-11')
    })

    it('load from empty local storage', async () => {
      localStorage.clear()

      render(
        <SchemaForm
          title="Sample Form"
          schema={schema}
          saveToStore={saveToStore}
          defaultValues={loadStore()}
        />
      )

      expect(screen.getByTestId('loanAmount')).toHaveValue('')
      expect(screen.getByTestId('downPaymentAmount')).toHaveValue('')
      expect(screen.getByTestId('firstName')).toHaveValue('')
      expect(screen.getByTestId('lastName')).toHaveValue('')
      expect(screen.getByTestId('birthDate')).toHaveValue('')
    })

    it('load from local storage with some missing fields', async () => {
      localStorage.setItem(
        'form-data',
        JSON.stringify({
          Loan: { loanAmount: 200000 },
          Borrower: { lastName: 'Jon' }
        })
      )

      render(
        <SchemaForm
          title="Sample Form"
          schema={schema}
          saveToStore={saveToStore}
          defaultValues={loadStore()}
        />
      )

      expect(screen.getByTestId('loanAmount')).toHaveValue('200000')
      expect(screen.getByTestId('downPaymentAmount')).toHaveValue('')
      expect(screen.getByTestId('firstName')).toHaveValue('')
      expect(screen.getByTestId('lastName')).toHaveValue('Jon')
      expect(screen.getByTestId('birthDate')).toHaveValue('')
    })

    it('load from local storage with missing entity', async () => {
      localStorage.setItem(
        'form-data',
        JSON.stringify({
          Borrower: { lastName: 'Jon' }
        })
      )

      render(
        <SchemaForm
          title="Sample Form"
          schema={schema}
          saveToStore={saveToStore}
          defaultValues={loadStore()}
        />
      )

      expect(screen.getByTestId('loanAmount')).toHaveValue('')
      expect(screen.getByTestId('downPaymentAmount')).toHaveValue('')
      expect(screen.getByTestId('firstName')).toHaveValue('')
      expect(screen.getByTestId('lastName')).toHaveValue('Jon')
      expect(screen.getByTestId('birthDate')).toHaveValue('')
    })

    it('store data is not json format', async () => {
      localStorage.setItem('form-data', 'non-json format')

      render(
        <SchemaForm
          title="Sample Form"
          schema={schema}
          saveToStore={saveToStore}
          defaultValues={loadStore()}
        />
      )

      expect(screen.getByTestId('loanAmount')).toHaveValue('')
      expect(screen.getByTestId('downPaymentAmount')).toHaveValue('')
      expect(screen.getByTestId('firstName')).toHaveValue('')
      expect(screen.getByTestId('lastName')).toHaveValue('')
      expect(screen.getByTestId('birthDate')).toHaveValue('')
    })

    it('keep all the rest value when a field is invalid', async () => {
      localStorage.setItem(
        'form-data',
        JSON.stringify({
          Borrower: { birthDate: 'non-date-format', firstName: 'Jon' },
          Loan: { loanAmount: 123456 }
        })
      )

      render(
        <SchemaForm
          title="Sample Form"
          schema={schema}
          saveToStore={saveToStore}
          defaultValues={loadStore()}
        />
      )

      expect(screen.getByTestId('loanAmount')).toHaveValue('123456')
      expect(screen.getByTestId('downPaymentAmount')).toHaveValue('')
      expect(screen.getByTestId('firstName')).toHaveValue('Jon')
      expect(screen.getByTestId('lastName')).toHaveValue('')
      expect(screen.getByTestId('birthDate')).toHaveValue('')
    })
  })
})
