import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('📍 Fetching all products...')
    const products = await prisma.product.findMany()
    
    console.log(`✅ Found ${products.length} products`)
    
    if (products.length === 0) {
      console.log('❌ No products found in database')
      return
    }
    
    // Mark first 3 products as featured and ACTIVE
    const productsToUpdate = products.slice(0, 3)
    
    console.log(`🔄 Marking ${productsToUpdate.length} products as featured...`)
    
    for (const product of productsToUpdate) {
      const updated = await prisma.product.update({
        where: { id: product.id },
        data: {
          featured: true,
          status: 'ACTIVE'
        }
      })
      console.log(`✅ Updated: ${updated.name} (featured: ${updated.featured}, status: ${updated.status})`)
    }
    
    console.log('✅ Done! Featured products updated.')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
