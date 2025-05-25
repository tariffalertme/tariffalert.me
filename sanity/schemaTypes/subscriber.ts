import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'subscriber',
  title: 'Subscriber',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Email Address',
      type: 'string',
      validation: (Rule) => [
        Rule.required().email(),
        // Rule.unique().error('Email address must be unique') // TODO: Revisit uniqueness validation
      ],
    }),
    defineField({
      name: 'countriesWatched',
      title: 'Countries Watched',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'country' } }],
      description: 'List of countries the subscriber is watching for tariff updates.',
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        // calendarTodayLabel: 'Today' // Removed invalid option
      },
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: 'email',
      subtitle: 'createdAt'
    }
  }
}) 