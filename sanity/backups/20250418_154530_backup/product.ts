export default {
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'impactScore',
      title: 'Impact Score',
      type: 'number',
      validation: (Rule: any) => Rule.required().min(0).max(100),
    },
    {
      name: 'dateAdded',
      title: 'Date Added',
      type: 'datetime',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'currentPrice',
      title: 'Current Price',
      type: 'number',
      validation: (Rule: any) => Rule.required().positive(),
    },
    {
      name: 'priceHistory',
      title: 'Price History',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {
            name: 'price',
            title: 'Price',
            type: 'number',
          },
          {
            name: 'date',
            title: 'Date',
            type: 'datetime',
          }
        ]
      }]
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category.name',
      media: 'image'
    },
  },
} 