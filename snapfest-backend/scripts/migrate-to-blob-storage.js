import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { uploadFileToBlob, isBlobStorageAvailable } from '../src/services/blobStorage.js';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Migration script to upload existing files from PUBLIC/uploads to Azure Blob Storage
 * 
 * Usage:
 *   node scripts/migrate-to-blob-storage.js [--dry-run] [--entity-type=packages|events|venues|beatbloom|profiles|all]
 * 
 * Options:
 *   --dry-run: Show what would be uploaded without actually uploading
 *   --entity-type: Specific entity type to migrate (default: all)
 */

const UPLOADS_DIR = path.join(__dirname, '..', 'PUBLIC', 'uploads');
const ENTITY_TYPES = ['packages', 'events', 'venues', 'beatbloom', 'profiles'];

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const entityTypeArg = args.find(arg => arg.startsWith('--entity-type='));
const entityTypeFilter = entityTypeArg ? entityTypeArg.split('=')[1] : 'all';

// Statistics
const stats = {
  total: 0,
  uploaded: 0,
  skipped: 0,
  failed: 0,
  errors: []
};

/**
 * Get all image files in a directory
 * @param {string} dirPath - Directory path
 * @returns {Array<string>} - Array of file paths
 */
const getImageFiles = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = [];
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    
    if (item.isDirectory()) {
      // Recursively get files from subdirectories
      files.push(...getImageFiles(fullPath));
    } else if (item.isFile()) {
      // Check if it's an image file
      const ext = path.extname(item.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
};

/**
 * Extract entity type from file path
 * @param {string} filePath - Full file path
 * @returns {string} - Entity type
 */
const getEntityTypeFromPath = (filePath) => {
  const normalizedPath = filePath.replace(/\\/g, '/');
  for (const entityType of ENTITY_TYPES) {
    if (normalizedPath.includes(`/uploads/${entityType}/`)) {
      return entityType;
    }
  }
  return 'packages'; // Default fallback
};

/**
 * Migrate files for a specific entity type
 * @param {string} entityType - Entity type to migrate
 * @returns {Promise<void>}
 */
const migrateEntityType = async (entityType) => {
  const entityDir = path.join(UPLOADS_DIR, entityType);
  
  if (!fs.existsSync(entityDir)) {
    console.log(`⚠️  Directory not found: ${entityDir}`);
    return;
  }

  console.log(`\n📁 Processing ${entityType}...`);
  const files = getImageFiles(entityDir);
  
  if (files.length === 0) {
    console.log(`   No files found in ${entityType}`);
    return;
  }

  console.log(`   Found ${files.length} file(s)`);

  for (const filePath of files) {
    stats.total++;
    const fileName = path.basename(filePath);
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);

    try {
      if (isDryRun) {
        console.log(`   [DRY RUN] Would upload: ${relativePath}`);
        stats.uploaded++;
      } else {
        console.log(`   Uploading: ${fileName}...`);
        const blobUrl = await uploadFileToBlob(filePath, entityType, fileName);
        
        if (blobUrl) {
          console.log(`   ✅ Uploaded: ${blobUrl}`);
          stats.uploaded++;
        } else {
          console.log(`   ⚠️  Skipped (blob storage not configured): ${relativePath}`);
          stats.skipped++;
        }
      }
    } catch (error) {
      console.error(`   ❌ Failed: ${relativePath} - ${error.message}`);
      stats.failed++;
      stats.errors.push({ file: relativePath, error: error.message });
    }
  }
};

/**
 * Main migration function
 */
const migrate = async () => {
  console.log('🚀 Starting migration to Azure Blob Storage...\n');

  // Check if blob storage is configured
  if (!isBlobStorageAvailable()) {
    console.error('❌ Azure Blob Storage is not configured!');
    console.error('   Please set AZURE_STORAGE_CONNECTION_STRING in your .env file');
    process.exit(1);
  }

  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No files will be uploaded\n');
  }

  // Determine which entity types to migrate
  const entityTypesToMigrate = entityTypeFilter === 'all' 
    ? ENTITY_TYPES 
    : [entityTypeFilter];

  // Validate entity types
  for (const entityType of entityTypesToMigrate) {
    if (!ENTITY_TYPES.includes(entityType)) {
      console.error(`❌ Invalid entity type: ${entityType}`);
      console.error(`   Valid types: ${ENTITY_TYPES.join(', ')}, all`);
      process.exit(1);
    }
  }

  // Migrate each entity type
  for (const entityType of entityTypesToMigrate) {
    await migrateEntityType(entityType);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  console.log(`Total files processed: ${stats.total}`);
  console.log(`✅ Successfully uploaded: ${stats.uploaded}`);
  console.log(`⚠️  Skipped: ${stats.skipped}`);
  console.log(`❌ Failed: ${stats.failed}`);

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors:');
    stats.errors.forEach(({ file, error }) => {
      console.log(`   - ${file}: ${error}`);
    });
  }

  if (isDryRun) {
    console.log('\n⚠️  This was a dry run. Run without --dry-run to actually upload files.');
  } else {
    console.log('\n✅ Migration completed!');
    console.log('\n⚠️  Note: Local files are NOT deleted by this script.');
    console.log('   You can manually delete them after verifying blob storage uploads.');
  }
};

// Run migration
migrate().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
