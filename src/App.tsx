import { FieldValues } from 'react-hook-form'
import SchemaForm, { Schema, serialize, deserialize } from 'components/SchemaForm'
import config from 'assets/schema.json'

const schema = config as Schema[]

const formKey = 'form-data'

export const saveToStore = (values: FieldValues) => {
  const currentStoreData = loadStore()
  const data = serialize(values, currentStoreData, schema)
  localStorage.setItem(formKey, data)
  // @todo api call here with data
  console.log(data)
}

export const loadStore = () => {
  const rawData = localStorage.getItem(formKey)
  if (rawData === null) {
    return undefined
  } else {
    return deserialize(rawData, schema)
  }
}

const App = () => (
  <SchemaForm
    schema={schema}
    title="Loan Information"
    saveToStore={saveToStore}
    defaultValues={loadStore()}
    className="mx-auto mt-12 p-3 w-full max-w-sm"
  />
)

export default App
