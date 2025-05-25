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
      name: 'category',
      title: 'Tag Category',
      type: 'string',
      options: {
        list: [
          {title: 'Product Category', value: 'product'},
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
      subtitle: 'category'
    },
    prepare({title, subtitle}) {
      return {
        title,
        subtitle: `Category: ${subtitle}`
      }
    }
  }
}) 