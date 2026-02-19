import { prisma } from "../src/libs/prisma"

async function main() {
  console.log('Sedang melakukan seeding kategori...')

  const categories = [
    { name: 'Web Development', slug: 'web-development' },
    { name: 'Mobile Development', slug: 'mobile-development' },
    { name: 'Data Science', slug: 'data-science' },
    { name: 'UI/UX Design', slug: 'ui-ux-design' },
    { name: 'Cyber Security', slug: 'cyber-security' },
    { name: 'Artificial Intelligence', slug: 'artificial-intelligence' },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: {
        name: category.name,
        slug: category.slug,
      },
    })
  }

  console.log('Seeding selesai!')
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