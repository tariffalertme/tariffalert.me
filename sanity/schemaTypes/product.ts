import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Products',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Product Name',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'image',
      title: 'Product Image',
      type: 'image',
      options: {
        hotspot: true
      },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'affiliateUrl',
      title: 'Affiliate URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
      description: 'Product will link directly to this URL'
    }),
    defineField({
      name: 'productCategories',
      title: 'Product Categories',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{type: 'tag'}],
        options: {
          filter: 'type == "product_category"'
        }
      }],
      validation: (Rule) => Rule.required().min(1),
      description: 'Add product category tags (e.g., Electronics, Automotive)'
    }),
    defineField({
      name: 'attributes',
      title: 'Product Attributes',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{type: 'tag'}],
        options: {
          filter: 'type == "attribute"'
        }
      }],
      description: 'Add attribute tags (e.g., Wireless, Waterproof)'
    }),
    defineField({
      name: 'relatedTariffUpdates',
      title: 'Related Tariff Updates',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{type: 'tariffUpdate'}]
      }],
      description: 'Link to relevant tariff updates affecting this product'
    })
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image'
    }
  }
}) 