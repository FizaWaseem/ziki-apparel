import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * DATABASE SEED V2 ENDPOINT
 * Improved version with better error handling and validation
 * Seeds database with categories, products, and variants
 * 
 * No auth required in debug mode
 */

interface SeedStats {
    adminCreated: boolean
    categoriesCreated: number
    productsCreated: number
    imagesCreated: number
    variantsCreated: number
    errorsEncountered: string[]
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    const stats: SeedStats = {
        adminCreated: false,
        categoriesCreated: 0,
        productsCreated: 0,
        imagesCreated: 0,
        variantsCreated: 0,
        errorsEncountered: []
    }

    try {
        console.log('🌱 Starting database seed v2...')

        // Check if already seeded
        const existingProducts = await prisma.product.count()
        if (existingProducts > 0) {
            return res.status(400).json({
                message: 'Database already has products - run db-clean first',
                productsCount: existingProducts,
                nextStep: 'POST to /api/admin/db-clean to reset'
            })
        }

        // CREATE ADMIN USER
        try {
            const hashedPassword = await bcrypt.hash('admin123', 12)
            await prisma.user.upsert({
                where: { email: 'admin@zikiapparel.com' },
                update: {},
                create: {
                    email: 'admin@zikiapparel.com',
                    name: 'Admin User',
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            })
            stats.adminCreated = true
            console.log('✅ Admin user created')
        } catch (e) {
            stats.errorsEncountered.push(`Admin creation: ${e instanceof Error ? e.message : 'Unknown'}`)
        }

        // CREATE CATEGORIES
        const categoryData = [
            { name: "Men's Jeans", slug: 'mens-jeans', description: 'Premium denim jeans for men' },
            { name: "Women's Jeans", slug: 'womens-jeans', description: 'Stylish denim jeans for women' }
        ]

        const categories: Record<string, { id: string; name: string; slug: string }> = {}
        for (const cat of categoryData) {
            try {
                categories[cat.slug] = await prisma.category.upsert({
                    where: { slug: cat.slug },
                    update: {},
                    create: cat
                })
                stats.categoriesCreated++
                console.log(`✅ Category created: ${cat.name}`)
            } catch (e) {
                stats.errorsEncountered.push(`Category ${cat.name}: ${e instanceof Error ? e.message : 'Unknown'}`)
            }
        }

        // PRODUCT SEED DATA
        const productsData = [
            {
                name: 'Classic Straight Leg Jeans',
                slug: 'classic-straight-leg-jeans',
                description: 'Timeless straight leg jeans made from premium denim. Perfect for everyday wear.',
                price: 1800.00,
                comparePrice: 2000.00,
                categoryId: categories['mens-jeans']?.id,
                featured: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', alt: 'Front View', position: 0 }
                ],
                variants: [
                    { size: '30', color: 'Dark Blue', stock: 15, price: 1900.00 },
                    { size: '32', color: 'Dark Blue', stock: 20, price: 1900.00 },
                    { size: '34', color: 'Dark Blue', stock: 18, price: 1800.00 }
                ]
            },
            {
                name: 'Slim Fit Dark Wash Jeans',
                slug: 'slim-fit-dark-wash-jeans',
                description: 'Modern slim fit jeans with comfortable stretch fabric.',
                price: 1900.00,
                categoryId: categories['mens-jeans']?.id,
                featured: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500', alt: 'Slim Fit', position: 0 }
                ],
                variants: [
                    { size: '28', color: 'Dark Wash', stock: 10, price: 1900.00 },
                    { size: '30', color: 'Dark Wash', stock: 15, price: 1900.00 },
                    { size: '32', color: 'Dark Wash', stock: 22, price: 1900.00 }
                ]
            },
            {
                name: 'High-Waisted Skinny Jeans',
                slug: 'high-waisted-skinny-jeans',
                description: 'Flattering high-waisted skinny jeans for women.',
                price: 1900.00,
                comparePrice: 2100.00,
                categoryId: categories['womens-jeans']?.id,
                featured: true,
                images: [
                    { url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500', alt: 'High-Waisted', position: 0 }
                ],
                variants: [
                    { size: '24', color: 'Light Blue', stock: 12, price: 1900.00 },
                    { size: '26', color: 'Light Blue', stock: 15, price: 1900.00 },
                    { size: '28', color: 'Light Blue', stock: 20, price: 1900.00 }
                ]
            },
            {
                name: 'Relaxed Fit Vintage Jeans',
                slug: 'relaxed-fit-vintage-jeans',
                description: 'Comfortable relaxed fit with vintage wash.',
                price: 1900.00,
                categoryId: categories['mens-jeans']?.id,
                featured: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500', alt: 'Vintage', position: 0 }
                ],
                variants: [
                    { size: '30', color: 'Vintage Wash', stock: 8, price: 1900.00 },
                    { size: '32', color: 'Vintage Wash', stock: 12, price: 1900.00 },
                    { size: '34', color: 'Vintage Wash', stock: 10, price: 1900.00 }
                ]
            },
            {
                name: 'Bootcut Classic Jeans',
                slug: 'bootcut-classic-jeans',
                description: 'Classic bootcut with flattering silhouette.',
                price: 1800.00,
                categoryId: categories['womens-jeans']?.id,
                featured: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=500', alt: 'Bootcut', position: 0 }
                ],
                variants: [
                    { size: '25', color: 'Medium Blue', stock: 14, price: 1800.00 },
                    { size: '27', color: 'Medium Blue', stock: 18, price: 1800.00 },
                    { size: '29', color: 'Medium Blue', stock: 16, price: 1800.00 }
                ]
            },
            {
                name: 'Raw Selvedge Denim',
                slug: 'raw-selvedge-denim',
                description: 'Premium raw selvedge denim for enthusiasts.',
                price: 1900.00,
                categoryId: categories['mens-jeans']?.id,
                featured: false,
                images: [
                    { url: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=500', alt: 'Raw Selvedge', position: 0 }
                ],
                variants: [
                    { size: '29', color: 'Raw Indigo', stock: 5, price: 1900.00 },
                    { size: '31', color: 'Raw Indigo', stock: 8, price: 1900.00 },
                    { size: '33', color: 'Raw Indigo', stock: 6, price: 1900.00 }
                ]
            }
        ]

        // CREATE PRODUCTS
        for (const productData of productsData) {
            try {
                if (!productData.categoryId) {
                    stats.errorsEncountered.push(`${productData.name}: Missing categoryId`)
                    continue
                }

                const { images, variants, ...productInfo } = productData

                const product = await prisma.product.create({
                    data: {
                        ...productInfo,
                        status: 'ACTIVE',
                        images: {
                            create: images
                        },
                        variants: {
                            create: variants
                        }
                    }
                })

                stats.productsCreated++
                stats.imagesCreated += images.length
                stats.variantsCreated += variants.length

                console.log(`✅ Product created: ${product.name} (${images.length} images, ${variants.length} variants)`)
            } catch (e) {
                const error = e instanceof Error ? e.message : 'Unknown'
                stats.errorsEncountered.push(`${productData.name}: ${error}`)
                console.error(`❌ Failed to create ${productData.name}:`, error)
            }
        }

        // VALIDATION
        console.log('\n📊 Validation...')
        const finalCounts = {
            products: await prisma.product.count({ where: { status: 'ACTIVE' } }),
            categories: await prisma.category.count(),
            images: await prisma.productImage.count(),
            variants: await prisma.productVariant.count()
        }

        const success = {
            message: stats.errorsEncountered.length === 0
                ? '✅ Database seeded successfully'
                : `⚠️ Seeded with ${stats.errorsEncountered.length} error(s)`,
            stats,
            finalCounts,
            errors: stats.errorsEncountered.length > 0 ? stats.errorsEncountered : undefined
        }

        if (stats.productsCreated === 0) {
            return res.status(500).json({
                ...success,
                message: '❌ FAILED: No products were created'
            })
        }

        return res.status(200).json(success)

    } catch (error) {
        console.error('❌ Seed error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        return res.status(500).json({
            message: 'Seeding failed',
            error: errorMessage,
            stats
        })
    }
}
