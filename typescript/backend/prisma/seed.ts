import { PrismaClient } from '../generated/client'

const prisma = new PrismaClient()

async function main() {
  const user1 = await prisma.user.create({
    data: {
      id: 1,
      email: 'user1@example.com',
      password: 'password123',
      name: 'User One',
      todos: {
        create: [
          {
            title: 'Complete project setup',
            description: 'Set up the development environment and install dependencies',
            completed: false,
          },
          {
            title: 'Write documentation',
            description: 'Document the API endpoints and database schema',
            completed: true,
          },
        ],
      },
    },
  })
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
