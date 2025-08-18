const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { User, Roadmap, Item, Vote, Tenant } = require('../src/models');

async function migrateToMultitenancy() {
  try {
    console.log('🚀 Starting multitenancy migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Create the default "hiver" tenant
    console.log('📝 Creating hiver tenant...');
    let hiverTenant = await Tenant.findOne({ subdomain: 'hiver' });
    
    if (!hiverTenant) {
      hiverTenant = await Tenant.create({
        subdomain: 'hiver',
        name: 'Hiver (Free Plan)',
        plan: 'free',
        status: 'active',
        settings: {
          theme: 'light',
          allowPublicVoting: true,
          emailNotifications: true
        },
        limits: {
          maxRoadmaps: 10,
          maxItemsPerRoadmap: 100,
          maxUsers: 5
        }
      });
      console.log('✅ Created hiver tenant:', hiverTenant._id);
    } else {
      console.log('✅ Hiver tenant already exists:', hiverTenant._id);
    }

    // Step 2: Migrate Users
    console.log('👥 Migrating users...');
    const usersWithoutTenant = await User.find({ tenant: { $exists: false } });
    if (usersWithoutTenant.length > 0) {
      await User.updateMany(
        { tenant: { $exists: false } },
        { 
          $set: { 
            tenant: hiverTenant._id,
            role: 'owner'
          }
        }
      );
      console.log(`✅ Migrated ${usersWithoutTenant.length} users to hiver tenant`);
    } else {
      console.log('✅ All users already have tenant assigned');
    }

    // Step 3: Migrate Roadmaps
    console.log('🗺️  Migrating roadmaps...');
    const roadmapsWithoutTenant = await Roadmap.find({ tenant: { $exists: false } });
    if (roadmapsWithoutTenant.length > 0) {
      await Roadmap.updateMany(
        { tenant: { $exists: false } },
        { $set: { tenant: hiverTenant._id } }
      );
      console.log(`✅ Migrated ${roadmapsWithoutTenant.length} roadmaps to hiver tenant`);
    } else {
      console.log('✅ All roadmaps already have tenant assigned');
    }

    // Step 4: Migrate Items
    console.log('📋 Migrating items...');
    const itemsWithoutTenant = await Item.find({ tenant: { $exists: false } });
    if (itemsWithoutTenant.length > 0) {
      await Item.updateMany(
        { tenant: { $exists: false } },
        { $set: { tenant: hiverTenant._id } }
      );
      console.log(`✅ Migrated ${itemsWithoutTenant.length} items to hiver tenant`);
    } else {
      console.log('✅ All items already have tenant assigned');
    }

    // Step 5: Migrate Votes
    console.log('🗳️  Migrating votes...');
    const votesWithoutTenant = await Vote.find({ tenant: { $exists: false } });
    if (votesWithoutTenant.length > 0) {
      await Vote.updateMany(
        { tenant: { $exists: false } },
        { $set: { tenant: hiverTenant._id } }
      );
      console.log(`✅ Migrated ${votesWithoutTenant.length} votes to hiver tenant`);
    } else {
      console.log('✅ All votes already have tenant assigned');
    }

    // Step 6: Verify migration
    console.log('🔍 Verifying migration...');
    const stats = {
      tenants: await Tenant.countDocuments(),
      users: await User.countDocuments({ tenant: hiverTenant._id }),
      roadmaps: await Roadmap.countDocuments({ tenant: hiverTenant._id }),
      items: await Item.countDocuments({ tenant: hiverTenant._id }),
      votes: await Vote.countDocuments({ tenant: hiverTenant._id })
    };

    console.log('📊 Migration Statistics:');
    console.log(`   Tenants: ${stats.tenants}`);
    console.log(`   Users in hiver: ${stats.users}`);
    console.log(`   Roadmaps in hiver: ${stats.roadmaps}`);
    console.log(`   Items in hiver: ${stats.items}`);
    console.log(`   Votes in hiver: ${stats.votes}`);

    console.log('🎉 Migration completed successfully!');
    console.log('ℹ️  All existing data has been assigned to the "hiver" tenant');
    console.log('ℹ️  You can now start creating custom tenants for customers');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToMultitenancy()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

module.exports = { migrateToMultitenancy };