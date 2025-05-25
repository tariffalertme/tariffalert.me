import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'productCategory',
  title: 'Product Categories',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Category Name',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96
      }
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3
    }),
    defineField({
      name: 'imageUrl',
      title: 'Category Image URL',
      type: 'url',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'imageAlt',
      title: 'Image Alt Text',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Important for SEO and accessibility.'
    }),
    defineField({
      name: 'parentCategory',
      title: 'Parent Category',
      type: 'reference',
      to: [{type: 'productCategory'}],
      description: 'Parent category if this is a subcategory'
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description'
    }
  }
}) 