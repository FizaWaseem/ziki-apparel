import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@zikiapparel.com' },
    update: {},
    create: {
      email: 'admin@zikiapparel.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Created admin user:', admin)

  // Create categories
  const mensCategory = await prisma.category.upsert({
    where: { slug: 'mens-jeans' },
    update: {},
    create: {
      name: "Men's Jeans",
      slug: 'mens-jeans',
      description: 'Premium denim jeans for men',
    },
  })

  const womensCategory = await prisma.category.upsert({
    where: { slug: 'womens-jeans' },
    update: {},
    create: {
      name: "Women's Jeans",
      slug: 'womens-jeans',
      description: 'Stylish denim jeans for women',
    },
  })

  console.log('Created categories')

  // Create sample products
  const products = [
    {
      name: 'Classic Straight Leg Jeans',
      slug: 'classic-straight-leg-jeans',
      description: 'Timeless straight leg jeans made from premium denim. Perfect for everyday wear with a comfortable fit and classic styling.',
      price: 1800.00,
      comparePrice: 2000.00,
      categoryId: mensCategory.id,
      featured: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
          alt: 'Classic Straight Leg Jeans - Front View',
          position: 0,
        },
        {
          url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
          alt: 'Classic Straight Leg Jeans - Back View',
          position: 1,
        },
      ],
      variants: [
        { size: '30', color: 'Dark Blue', stock: 15, price: 1900.00 },
        { size: '32', color: 'Dark Blue', stock: 20, price: 1900.00 },
        { size: '34', color: 'Dark Blue', stock: 18, price: 1800.00 },
        { size: '36', color: 'Dark Blue', stock: 12, price: 1800.00 },
      ],
    },
    {
      name: 'Slim Fit Dark Wash Jeans',
      slug: 'slim-fit-dark-wash-jeans',
      description: 'Modern slim fit jeans in dark wash. Features a tapered leg and comfortable stretch fabric for all-day comfort.',
      price: 1900.00,
      categoryId: mensCategory.id,
      featured: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500',
          alt: 'Slim Fit Dark Wash Jeans',
          position: 0,
        },
      ],
      variants: [
        { size: '28', color: 'Dark Wash', stock: 10, price: 1900.00 },
        { size: '30', color: 'Dark Wash', stock: 15, price: 1900.00 },
        { size: '32', color: 'Dark Wash', stock: 22, price: 1900.00 },
        { size: '34', color: 'Dark Wash', stock: 18, price: 1900.00 },
      ],
    },
    {
      name: 'High-Waisted Skinny Jeans',
      slug: 'high-waisted-skinny-jeans',
      description: 'Flattering high-waisted skinny jeans for women. Made with stretch denim for comfort and a perfect fit.',
      price: 1900.00,
      comparePrice: 2100.00,
      categoryId: womensCategory.id,
      featured: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500',
          alt: 'High-Waisted Skinny Jeans',
          position: 0,
        },
      ],
      variants: [
        { size: '24', color: 'Light Blue', stock: 12, price: 1900.00 },
        { size: '26', color: 'Light Blue', stock: 15, price: 1900.00 },
        { size: '28', color: 'Light Blue', stock: 20, price: 1900.00 },
        { size: '30', color: 'Light Blue', stock: 14, price: 1900.00 },
      ],
    },
    {
      name: 'Relaxed Fit Vintage Jeans',
      slug: 'relaxed-fit-vintage-jeans',
      description: 'Comfortable relaxed fit jeans with vintage wash and distressed details. Perfect for casual weekend wear.',
      price: 1900.00,
      categoryId: mensCategory.id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500',
          alt: 'Relaxed Fit Vintage Jeans',
          position: 0,
        },
      ],
      variants: [
        { size: '30', color: 'Vintage Wash', stock: 8, price: 1900.00 },
        { size: '32', color: 'Vintage Wash', stock: 12, price: 1900.00 },
        { size: '34', color: 'Vintage Wash', stock: 10, price: 1900.00 },
        { size: '36', color: 'Vintage Wash', stock: 6, price: 1900.00 },
      ],
    },
    {
      name: 'Bootcut Classic Jeans',
      slug: 'bootcut-classic-jeans',
      description: 'Classic bootcut jeans for women with a flattering silhouette. Perfect for wearing with boots or heels.',
      price: 1800.00,
      categoryId: womensCategory.id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=500',
          alt: 'Bootcut Classic Jeans',
          position: 0,
        },
      ],
      variants: [
        { size: '25', color: 'Medium Blue', stock: 14, price: 1800.00 },
        { size: '27', color: 'Medium Blue', stock: 18, price: 1800.00 },
        { size: '29', color: 'Medium Blue', stock: 16, price: 1800.00 },
        { size: '31', color: 'Medium Blue', stock: 11, price: 1800.00 },
      ],
    },
    {
      name: 'Raw Selvedge Denim',
      slug: 'raw-selvedge-denim',
      description: 'Premium raw selvedge denim for the true denim enthusiast. Unwashed and ready to develop unique fading patterns.',
      price: 1900.00,
      categoryId: mensCategory.id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=500',
          alt: 'Raw Selvedge Denim',
          position: 0,
        },
      ],
      variants: [
        { size: '29', color: 'Raw Indigo', stock: 5, price: 1900.00 },
        { size: '31', color: 'Raw Indigo', stock: 8, price: 1900.00 },
        { size: '33', color: 'Raw Indigo', stock: 6, price: 1900.00 },
        { size: '35', color: 'Raw Indigo', stock: 4, price: 1900.00 },
      ],
    },
  ]

  for (const productData of products) {
    const { images, variants, ...productInfo } = productData
    
    const product = await prisma.product.create({
      data: {
        ...productInfo,
        images: {
          create: images,
        },
        variants: {
          create: variants,
        },
      },
    })

    console.log(`Created product: ${product.name}`)
  }

  // Create sample customer
  const customerPassword = await bcrypt.hash('customer123', 12)
  
  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      name: 'John Customer',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  })

  console.log('Created customer user:', customer)

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })