import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import schema from 'assets/schema.json'
import SchemaForm, { Schema } from 'components/SchemaForm'
import { saveToStore, loadStore } from 'App'

export default {
  title: 'SchemaForm',
  component: SchemaForm
} as ComponentMeta<typeof SchemaForm>

const ValidationOnlyTemplate: ComponentStory<typeof SchemaForm> = (args) => <SchemaForm {...args} />

export const ValidationOnly = ValidationOnlyTemplate.bind({})

ValidationOnly.args = {
  schema: schema as Schema[],
  title: 'Loan Information'
}

interface WithStoreProps {
  schema: Schema[]
  title: string
}

const WithStoreComp: React.FC<WithStoreProps> = ({ schema, title }) => (
  <SchemaForm schema={schema} title={title} saveToStore={saveToStore} defaultValues={loadStore()} />
)
const WithStoreTemplate: ComponentStory<typeof WithStoreComp> = (args) => (
  <WithStoreComp {...args} />
)

export const WithStore = WithStoreTemplate.bind({})

WithStore.args = {
  schema: schema as Schema[],
  title: 'Loan Information'
}
