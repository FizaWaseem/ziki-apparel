import { prisma } from './src/lib/prisma'

async function checkProducts() {
    try {
        console.log('📦 Checking Products in Database...\n')

        // Count by status
        const allCount = await prisma.product.count()
        const activeCount = await prisma.product.count({ where: { status: 'ACTIVE' } })
        const draftCount = await prisma.product.count({ where: { status: 'DRAFT' } })
        const archivedCount = await prisma.product.count({ where: { status: 'ARCHIVED' } })

        console.log(`✅ Total products: ${allCount}`)
        console.log(`✅ Active products: ${activeCount}`)
        console.log(`📝 Draft products: ${draftCount}`)
        console.log(`🗑 Archived products: ${archivedCount}\n`)

        // Show first 5 products
        const products = await prisma.product.findMany({
            take: 5,
            select: {
                id: true,
                name: true,
                status: true,
                price: true,
                slug: true
            }
        })

        if (products.length > 0) {
            console.log('📋 Sample Products:')
            products.forEach(p => {
                console.log(`  - ${p.name} (${p.status}) - $${p.price}`)
            })
        } else {
            console.log('❌ No products found in database!')
        }

        await prisma.$disconnect()
    } catch (error) {
        console.error('❌ Error:', error)
        process.exit(1)
    }
}

checkProducts()
