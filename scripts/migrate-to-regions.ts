/**
 * Migration Script: Country to Region Migration
 * 
 * This script migrates existing data from the country-based system to the new region-based system.
 * It updates:
 * 1. Events: Adds region field based on country
 * 2. Users: Adds region field based on country preferences
 * 
 * Run this script after deploying the new models but before going live with the region feature.
 */

import { connectToDatabase } from '../lib/database';
import Event from '../lib/database/models/event.model';
import User from '../lib/database/models/user.model';

interface MigrationStats {
  eventsUpdated: number;
  usersUpdated: number;
  errors: string[];
}

async function migrateEventsToRegions(): Promise<{ updated: number; errors: string[] }> {
  const stats = { updated: 0, errors: [] };
  
  try {
    // Find all events without region field
    const eventsToUpdate = await Event.find({ 
      region: { $exists: false },
      isDeleted: { $ne: true }
    });

    console.log(`Found ${eventsToUpdate.length} events to migrate`);

    for (const event of eventsToUpdate) {
      try {
        let region = 'Singapore'; // Default
        
        if (event.country === 'Malaysia') {
          // For existing Malaysia events, default to KL
          // Admins can manually update to JB if needed
          region = 'Malaysia-KL';
        } else if (event.country === 'Singapore') {
          region = 'Singapore';
        }

        await Event.findByIdAndUpdate(event._id, { region });
        stats.updated++;
        
        if (stats.updated % 10 === 0) {
          console.log(`Migrated ${stats.updated} events...`);
        }
      } catch (error) {
        const errorMsg = `Failed to update event ${event._id}: ${error}`;
        stats.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
  } catch (error) {
    const errorMsg = `Failed to fetch events for migration: ${error}`;
    stats.errors.push(errorMsg);
    console.error(errorMsg);
  }

  return stats;
}

async function migrateUsersToRegions(): Promise<{ updated: number; errors: string[] }> {
  const stats = { updated: 0, errors: [] };
  
  try {
    // Find all users without region field
    const usersToUpdate = await User.find({ 
      region: { $exists: false }
    });

    console.log(`Found ${usersToUpdate.length} users to migrate`);

    for (const user of usersToUpdate) {
      try {
        // Default all users to Singapore initially
        // They can change their region through the UI
        const region = 'Singapore';

        await User.findByIdAndUpdate(user._id, { region });
        stats.updated++;
        
        if (stats.updated % 100 === 0) {
          console.log(`Migrated ${stats.updated} users...`);
        }
      } catch (error) {
        const errorMsg = `Failed to update user ${user._id}: ${error}`;
        stats.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
  } catch (error) {
    const errorMsg = `Failed to fetch users for migration: ${error}`;
    stats.errors.push(errorMsg);
    console.error(errorMsg);
  }

  return stats;
}

async function runMigration(): Promise<void> {
  console.log('🚀 Starting migration from country-based to region-based system...');
  
  try {
    await connectToDatabase();
    console.log('✅ Connected to database');

    const migrationStats: MigrationStats = {
      eventsUpdated: 0,
      usersUpdated: 0,
      errors: []
    };

    // Migrate events
    console.log('\n📅 Migrating events...');
    const eventStats = await migrateEventsToRegions();
    migrationStats.eventsUpdated = eventStats.updated;
    migrationStats.errors.push(...eventStats.errors);

    // Migrate users  
    console.log('\n👥 Migrating users...');
    const userStats = await migrateUsersToRegions();
    migrationStats.usersUpdated = userStats.updated;
    migrationStats.errors.push(...userStats.errors);

    // Print final stats
    console.log('\n📊 Migration completed!');
    console.log('═══════════════════════════════════════');
    console.log(`Events updated: ${migrationStats.eventsUpdated}`);
    console.log(`Users updated: ${migrationStats.usersUpdated}`);
    console.log(`Total errors: ${migrationStats.errors.length}`);
    
    if (migrationStats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      migrationStats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ Migration completed successfully with no errors!');
    }

    console.log('\n📝 Next steps:');
    console.log('1. Verify the migration results in your database');
    console.log('2. Test the region selector functionality');
    console.log('3. Inform Malaysian users to select their preferred region');
    console.log('4. Review any events that were defaulted to Malaysia-KL and update if needed');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { runMigration, migrateEventsToRegions, migrateUsersToRegions }; 