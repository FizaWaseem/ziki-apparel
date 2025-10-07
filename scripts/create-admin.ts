import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Set your desired admin credentials here
    const adminEmail = 'admin@zikiapparel.com'
    const adminPassword = 'admin123' // Change this to your desired password
    const adminName = 'Admin User'

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingAdmin) {
      // Update existing admin password
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          role: 'ADMIN'
        }
      })
      console.log(`✅ Updated admin password for: ${adminEmail}`)
    } else {
      // Create new admin user
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: hashedPassword,
          role: 'ADMIN'
        }
      })
      console.log(`✅ Created new admin user: ${adminEmail}`)
    }

    console.log(`📧 Email: ${adminEmail}`)
    console.log(`🔑 Password: ${adminPassword}`)
    console.log(`⚠️  Remember to change this password after first login!`)

  } catch (error) {
    console.error('❌ Error creating admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()