interface PreviewProps {
  title: string;
  subtitle: number | undefined;
  media: any; // Sanity image type
}

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
      name: 'sourceUrl',
      title: 'Product URL',
      type: 'url',
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
      name: 'currentPrice',
      title: 'Current Price',
      type: 'number',
      validation: (Rule: any) => Rule.required().positive(),
    },
    {
      name: 'countryTags',
      title: 'Affected Countries',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{ type: 'country' }]
      }],
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'tags',
      title: 'Product Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags'
      }
    },
    {
      name: 'dateAdded',
      title: 'Date Added',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    },
    {
      name: 'lastChecked',
      title: 'Last Price Check',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'currentPrice',
      media: 'image'
    },
    prepare({ title, subtitle, media }: { title: string; subtitle: number | undefined; media: any }) {
      return {
        title,
        subtitle: subtitle ? `$${subtitle.toFixed(2)}` : 'No price set',
        media
      }
    }
  },
} 