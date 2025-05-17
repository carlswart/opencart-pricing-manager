/**
 * Milestone service for tracking time-saving achievements
 * This service manages gamification features to celebrate time-saving milestones.
 */
import { db, sqlite } from "../db";
import { milestones } from "@shared/schema";
import { eq, lt, and } from "drizzle-orm";

// Milestone levels that will be tracked (in minutes)
export const MILESTONE_LEVELS = [
  {
    minutes: 30, 
    name: "30 Minutes Saved", 
    description: "You've saved half an hour of manual work! Great start!",
    icon: "clock"
  },
  {
    minutes: 60, 
    name: "1 Hour Saved", 
    description: "You've saved a full hour! That's significant time back in your day.",
    icon: "hourglass"
  },
  {
    minutes: 240, 
    name: "4 Hours Saved", 
    description: "Half a workday saved! Your efficiency is really adding up.",
    icon: "clipboard-check"
  },
  {
    minutes: 480, 
    name: "8 Hours Saved", 
    description: "A full workday saved! Think of all you can accomplish with this extra time.",
    icon: "calendar-check"
  },
  {
    minutes: 960, 
    name: "2 Days Saved", 
    description: "Two full workdays saved! That's significant productivity gained.",
    icon: "award"
  },
  {
    minutes: 3360, 
    name: "1 Week Saved", 
    description: "A full work week saved! Your investment in automation is paying off big time.",
    icon: "trophy"
  },
  {
    minutes: 6720, 
    name: "2 Weeks Saved", 
    description: "Two full work weeks saved! Your efficiency is transformative.",
    icon: "medal"
  },
  {
    minutes: 13440, 
    name: "1 Month Saved", 
    description: "A full month of work time saved! You're a productivity champion.",
    icon: "crown"
  },
  {
    minutes: 26880, 
    name: "2 Months Saved", 
    description: "Two months of work time saved! Your efficiency is remarkable.",
    icon: "gem"
  },
  {
    minutes: 80640, 
    name: "6 Months Saved", 
    description: "Half a year of work time saved! You're a true automation master.",
    icon: "diamond"
  }
];

/**
 * Initialize milestones in the database
 * This should be called when the application is first set up
 */
export async function initializeMilestones() {
  try {
    // Check if milestones already exist
    const existingMilestones = await db.select().from(milestones);
    
    if (existingMilestones.length === 0) {
      // No milestones exist yet, create them
      console.log("Initializing milestone achievement tracking...");
      
      // Insert all predefined milestone levels
      for (const milestone of MILESTONE_LEVELS) {
        await db.insert(milestones).values({
          minutes: milestone.minutes,
          name: milestone.name,
          description: milestone.description,
          icon: milestone.icon,
          created_at: new Date().toISOString()
        });
      }
      
      console.log(`Created ${MILESTONE_LEVELS.length} milestone tracking levels`);
    } else {
      console.log(`Milestones already initialized (${existingMilestones.length} milestones found)`);
    }
  } catch (error) {
    console.error("Error initializing milestones:", error);
  }
}

/**
 * Check if any new milestones have been achieved based on current saved time
 * @param totalMinutesSaved The total minutes saved so far
 * @returns The newly achieved milestone, if any
 */
export async function checkMilestones(totalMinutesSaved: number) {
  try {
    // Find milestones that have been achieved but not yet marked as such
    const newlyAchievedMilestones = await db.select()
      .from(milestones)
      .where(
        and(
          lt(milestones.minutes, totalMinutesSaved),
          eq(milestones.achieved, false)
        )
      );
      
    if (newlyAchievedMilestones.length > 0) {
      // Sort by minutes to get the highest achieved milestone
      const sortedMilestones = newlyAchievedMilestones.sort((a, b) => b.minutes - a.minutes);
      const highestMilestone = sortedMilestones[0];
      
      // Mark this milestone as achieved
      await db.update(milestones)
        .set({ 
          achieved: true,
          achieved_at: new Date().toISOString()
        })
        .where(eq(milestones.id, highestMilestone.id));
      
      console.log(`Milestone achieved: ${highestMilestone.name}`);
      
      // Return the newly achieved milestone
      return highestMilestone;
    }
    
    return null;
  } catch (error) {
    console.error("Error checking milestones:", error);
    return null;
  }
}

/**
 * Get all milestones that have been achieved
 * @returns Array of achieved milestones
 */
export async function getAchievedMilestones() {
  try {
    const achievedMilestones = await db.select()
      .from(milestones)
      .where(eq(milestones.achieved, true))
      .orderBy(milestones.minutes);
    
    return achievedMilestones;
  } catch (error) {
    console.error("Error getting achieved milestones:", error);
    return [];
  }
}

/**
 * Get the next milestone to be achieved
 * @param totalMinutesSaved The total minutes saved so far
 * @returns The next milestone to be achieved
 */
export async function getNextMilestone(totalMinutesSaved: number) {
  try {
    // Find the next milestone that hasn't been achieved
    const [nextMilestone] = await db.select()
      .from(milestones)
      .where(
        and(
          eq(milestones.achieved, false),
          lt(totalMinutesSaved, milestones.minutes)
        )
      )
      .orderBy(milestones.minutes)
      .limit(1);
    
    return nextMilestone || null;
  } catch (error) {
    console.error("Error getting next milestone:", error);
    return null;
  }
}