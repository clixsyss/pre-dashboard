import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { defaultSports } from '../data/defaultSports';

/**
 * Initialize sports for all existing projects
 * This function will add default sports to any project that doesn't have them
 */
export const initializeSportsForAllProjects = async () => {
  try {
    console.log('Starting sports initialization for all projects...');
    
    // Get all projects
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${projects.length} projects`);

    let totalSportsAdded = 0;
    let projectsProcessed = 0;

    for (const project of projects) {
      try {
        console.log(`Processing project: ${project.name || project.id}`);
        
        // Check if project already has sports
        const sportsSnapshot = await getDocs(collection(db, `projects/${project.id}/sports`));
        const existingSports = sportsSnapshot.docs.map(doc => doc.data().name);
        
        if (existingSports.length === 0) {
          console.log(`No sports found for project ${project.id}, adding default sports...`);
          
          // Add all default sports to this project
          const sportsToAdd = defaultSports.map(sport => ({
            ...sport,
            projectId: project.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }));

          // Add sports in batches to avoid overwhelming Firestore
          const batchSize = 10;
          for (let i = 0; i < sportsToAdd.length; i += batchSize) {
            const batch = sportsToAdd.slice(i, i + batchSize);
            await Promise.all(
              batch.map(sport => 
                addDoc(collection(db, `projects/${project.id}/sports`), sport)
              )
            );
          }
          
          totalSportsAdded += sportsToAdd.length;
          console.log(`Added ${sportsToAdd.length} sports to project ${project.id}`);
        } else {
          console.log(`Project ${project.id} already has ${existingSports.length} sports`);
        }
        
        projectsProcessed++;
      } catch (error) {
        console.error(`Error processing project ${project.id}:`, error);
      }
    }

    console.log(`Sports initialization complete. Processed ${projectsProcessed} projects, added ${totalSportsAdded} sports total.`);
    return { projectsProcessed, totalSportsAdded };
  } catch (error) {
    console.error('Error initializing sports for all projects:', error);
    throw error;
  }
};

/**
 * Initialize sports for a specific project
 */
export const initializeSportsForProject = async (projectId) => {
  try {
    console.log(`Initializing sports for project: ${projectId}`);
    
    // Check if project already has sports
    const sportsSnapshot = await getDocs(collection(db, `projects/${projectId}/sports`));
    const existingSports = sportsSnapshot.docs.map(doc => doc.data().name);
    
    if (existingSports.length === 0) {
      console.log(`No sports found for project ${projectId}, adding default sports...`);
      
      // Add all default sports to this project
      const sportsToAdd = defaultSports.map(sport => ({
        ...sport,
        projectId: projectId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }));

      // Add sports in batches
      const batchSize = 10;
      for (let i = 0; i < sportsToAdd.length; i += batchSize) {
        const batch = sportsToAdd.slice(i, i + batchSize);
        await Promise.all(
          batch.map(sport => 
            addDoc(collection(db, `projects/${projectId}/sports`), sport)
          )
        );
      }
      
      console.log(`Added ${sportsToAdd.length} sports to project ${projectId}`);
      return { success: true, sportsAdded: sportsToAdd.length };
    } else {
      console.log(`Project ${projectId} already has ${existingSports.length} sports`);
      return { success: true, sportsAdded: 0, message: 'Sports already exist' };
    }
  } catch (error) {
    console.error(`Error initializing sports for project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Check if a project has sports and return count
 */
export const checkProjectSports = async (projectId) => {
  try {
    const sportsSnapshot = await getDocs(collection(db, `projects/${projectId}/sports`));
    return sportsSnapshot.docs.length;
  } catch (error) {
    console.error(`Error checking sports for project ${projectId}:`, error);
    return 0;
  }
};

/**
 * Get missing sports for a project (sports that exist in defaultSports but not in the project)
 */
export const getMissingSports = async (projectId) => {
  try {
    const sportsSnapshot = await getDocs(collection(db, `projects/${projectId}/sports`));
    const existingSports = sportsSnapshot.docs.map(doc => doc.data().name);
    
    return defaultSports.filter(sport => !existingSports.includes(sport.name));
  } catch (error) {
    console.error(`Error getting missing sports for project ${projectId}:`, error);
    return [];
  }
};
