import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { UserModel } from '../models/user.model.js'

async function migrateRoles() {
  await connectDatabase()

  try {
    const admins = await UserModel.collection.updateMany({ role: 'admin' }, { $set: { role: 'moderator' } })
    const superadmins = await UserModel.collection.updateMany({ role: 'superadmin' }, { $set: { role: 'admin' } })

    console.info(`Migrated legacy admin -> moderator: ${admins.modifiedCount}`)
    console.info(`Migrated legacy superadmin -> admin: ${superadmins.modifiedCount}`)
  } finally {
    await disconnectDatabase()
  }
}

migrateRoles().catch((error: unknown) => {
  console.error('Could not migrate roles.', error)
  process.exit(1)
})
