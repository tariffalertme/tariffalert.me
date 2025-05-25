import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

if (!process.env.SANITY_STUDIO_API_PROJECT_ID) {
  throw new Error('SANITY_STUDIO_API_PROJECT_ID environment variable is required')
}

if (!process.env.SANITY_STUDIO_API_DATASET) {
  throw new Error('SANITY_STUDIO_API_DATASET environment variable is required')
}

export default defineConfig({
  name: 'default',
  title: 'tariffalert',

  projectId: process.env.SANITY_STUDIO_API_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_API_DATASET,

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  }
})
