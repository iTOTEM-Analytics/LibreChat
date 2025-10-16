// backend/api/v1/storyfinder/scripts/syncStoryIds.js
const fs = require('fs');
const path = require('path');

const CANDIDATE_FILE = path.join(__dirname, '../data/storycandidatedata.json');
const STORY_FILE = path.join(__dirname, '../data/generatedstory.json');

function syncStoryIds() {
  try {
    // Read candidate data
    const candidateData = JSON.parse(fs.readFileSync(CANDIDATE_FILE, 'utf8'));
    
    // Check if story file exists, if not create empty array
    let storyData = [];
    if (fs.existsSync(STORY_FILE)) {
      storyData = JSON.parse(fs.readFileSync(STORY_FILE, 'utf8'));
    }
    
    // console.log('🔄 Starting automatic ID synchronization...');
    
    // Create a map of vendor names to candidate IDs
    const vendorToCandidateMap = new Map();
    
    // Build mapping from candidate data
    for (const [projectId, candidates] of Object.entries(candidateData.projects)) {
      for (const candidate of candidates) {
        const vendorKey = candidate.vendor_name?.toLowerCase().trim();
        if (vendorKey) {
          vendorToCandidateMap.set(vendorKey, {
            projectId: candidate.projectId,
            candidateId: candidate.id,
            vendor: candidate.vendor_name
          });
        }
      }
    }
    
    console.log(`📊 Found ${vendorToCandidateMap.size} candidates`);
    
    // Update story IDs to match candidate IDs
    let updatedCount = 0;
    const updatedStories = storyData.map(story => {
      const vendorKey = story.vendor?.toLowerCase().trim();
      const candidateInfo = vendorToCandidateMap.get(vendorKey);
      
      if (candidateInfo) {
        // Check if IDs need updating
        if (story.projectId !== candidateInfo.projectId || story.candidateId !== candidateInfo.candidateId) {
          console.log(`🔄 Updating ${story.vendor}:`);
          console.log(`   Project: ${story.projectId} → ${candidateInfo.projectId}`);
          console.log(`   Candidate: ${story.candidateId} → ${candidateInfo.candidateId}`);
          
          updatedCount++;
          return {
            ...story,
            projectId: candidateInfo.projectId,
            candidateId: candidateInfo.candidateId
          };
        }
      } else {
        console.log(`⚠️  No candidate found for story: ${story.vendor}`);
      }
      
      return story;
    });
    
    // Write updated stories back to file
    if (updatedCount > 0) {
      fs.writeFileSync(STORY_FILE, JSON.stringify(updatedStories, null, 2));
      console.log(`✅ Updated ${updatedCount} stories`);
    } else {
      console.log('✅ All stories are already in sync');
    }
    
    return { updatedCount, totalStories: updatedStories.length };
    
  } catch (error) {
    console.error('❌ Error syncing story IDs:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  syncStoryIds();
}

module.exports = { syncStoryIds };
