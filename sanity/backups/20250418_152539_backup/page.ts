import { Rule } from '@sanity/types'

export default {
  name: 'page',
  title: 'Pages',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Page Title',
      type: 'string',
      validation: (Rule: Rule) => Rule.required()
    },
    {
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: (Rule: Rule) => Rule.required()
    },
    {
      name: 'description',
      title: 'Page Content',
      type: 'array',
      of: [{ type: 'block' }],
      validation: (Rule: Rule) => Rule.required()
    },
    {
      name: 'shortDescription',
      title: 'Short Description',
      description: 'A brief description that appears at the top of the page (optional)',
      type: 'text',
      rows: 3
    },
    {
      name: 'showContactForm',
      title: 'Show Contact Form',
      type: 'boolean',
      initialValue: false
    }
  ]
} 