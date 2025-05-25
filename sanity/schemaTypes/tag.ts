import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'tag',
  title: 'Tags',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Tag Name',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'type',
      title: 'Tag Type',
      type: 'string',
      options: {
        list: [
          {title: 'Product Category', value: 'product_category'},
          {title: 'Country', value: 'country'},
          {title: 'Product Attribute', value: 'attribute'},
          {title: 'Industry', value: 'industry'}
        ]
      },
      validation: (Rule) => Rule.required()
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'type'
    },
    prepare({title, subtitle}) {
      return {
        title,
        subtitle: `Type: ${subtitle}`
      }
    }
  }
}) 