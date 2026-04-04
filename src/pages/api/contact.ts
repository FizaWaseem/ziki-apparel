import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters')
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { name, email, subject, message } = contactSchema.parse(req.body)

    // TODO: Implement email sending after deployment
    console.log('Contact form submission:', { name, email, subject, message })

    res.status(200).json({ message: 'Message sent successfully' })

  } catch (error) {
    console.error('Contact form error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      })
    }

    res.status(500).json({ message: 'Internal server error' })
  }
}