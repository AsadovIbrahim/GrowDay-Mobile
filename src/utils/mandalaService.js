import { storage } from './MMKVStore';

const STORAGE_KEYS = {
  GOAL: 'mandala_goal',
  DIRECTIONS: 'mandala_directions',
  DAILY_TASKS: 'mandala_daily_tasks',
  LAST_TASK_GEN_DATE: 'mandala_last_task_gen_date',
};

// Default 8 Life Directions for Life Balance Grid / Mandala
export const DEFAULT_DIRECTIONS = [
  {
    id: 'health',
    goalId: 'default-goal',
    name: 'Health',
    description: 'Physical health, nutrition, and fitness',
    icon: '🏃',
    order: 1,
    progress: 70,
    bgGradient: ['#FF8A65', '#FF7043'], // Orange gradient
    accentColor: '#FF7043',
  },
  {
    id: 'learning',
    goalId: 'default-goal',
    name: 'Learning',
    description: 'Knowledge, books, and skill acquisition',
    icon: '📚',
    order: 2,
    progress: 10,
    bgGradient: ['#37474F', '#263238'], // Slate gradient
    accentColor: '#455A64',
  },
  {
    id: 'mindset',
    goalId: 'default-goal',
    name: 'Mindset',
    description: 'Mental clarity, mindfulness, and emotions',
    icon: '🧘',
    order: 3,
    progress: 98,
    bgGradient: ['#26A69A', '#00897B'], // Teal/Green gradient
    accentColor: '#00897B',
  },
  {
    id: 'career',
    goalId: 'default-goal',
    name: 'Career',
    description: 'Professional growth, projects, and work',
    icon: '💼',
    order: 4,
    progress: 100,
    bgGradient: ['#EC407A', '#D81B60'], // Pink/Red gradient
    accentColor: '#D81B60',
  },
  {
    id: 'finance',
    goalId: 'default-goal',
    name: 'Finance',
    description: 'Budgeting, savings, and investments',
    icon: '💰',
    order: 5,
    progress: 70,
    bgGradient: ['#FBC02D', '#F57F17'], // Yellow/Gold gradient
    accentColor: '#F57F17',
  },
  {
    id: 'social',
    goalId: 'default-goal',
    name: 'Social',
    description: 'Relationships, family, and networking',
    icon: '🤝',
    order: 6,
    progress: 73,
    bgGradient: ['#AB47BC', '#8E24AA'], // Purple gradient
    accentColor: '#8E24AA',
  },
  {
    id: 'wellness',
    goalId: 'default-goal',
    name: 'Wellness',
    description: 'Sleep, stress management, and rest',
    icon: '💤',
    order: 7,
    progress: 30,
    bgGradient: ['#26C6DA', '#00ACC1'], // Cyan gradient
    accentColor: '#00ACC1',
  },
  {
    id: 'growth',
    goalId: 'default-goal',
    name: 'Growth',
    description: 'Personal development and hobbies',
    icon: '🌱',
    order: 8,
    progress: 55,
    bgGradient: ['#66BB6A', '#43A047'], // Bright green gradient
    accentColor: '#43A047',
  },
];

// Helper to get directions from storage or defaults
export const getStoredDirections = () => {
  try {
    const raw = storage.getString(STORAGE_KEYS.DIRECTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.log('Error reading mandala directions from storage:', e);
  }
  return DEFAULT_DIRECTIONS;
};

// Helper to save directions
export const saveDirectionsToStore = (directions) => {
  try {
    storage.set(STORAGE_KEYS.DIRECTIONS, JSON.stringify(directions));
  } catch (e) {
    console.log('Error saving mandala directions:', e);
  }
};

// AI Goal Creator: Create Goal -> Analyze -> Generate 8 Directions
export const createAiMandalaGoal = (goalTitle) => {
  const goal = {
    id: `goal_${Date.now()}`,
    title: goalTitle,
    createdAt: new Date().toISOString(),
    progress: 0,
    isCompleted: false,
  };

  // Generate 8 customized directions tailored to the user's goal
  const customDirections = DEFAULT_DIRECTIONS.map((dir, index) => ({
    ...dir,
    goalId: goal.id,
    progress: Math.floor(Math.random() * 40) + 10, // initial baseline progress
    name: dir.name,
  }));

  try {
    storage.set(STORAGE_KEYS.GOAL, JSON.stringify(goal));
    saveDirectionsToStore(customDirections);
  } catch (e) {
    console.log('Error storing AI mandala goal:', e);
  }

  return { goal, directions: customDirections };
};

// AI Rebalance & Daily Tasks Generator
// 3-5 tasks generated per day based on direction priorities (weaker directions get more tasks)
export const generateDailyAiTasks = () => {
  const directions = getStoredDirections();
  const sortedDirections = [...directions].sort((a, b) => a.progress - b.progress);

  // Weaker directions (lower progress) get priority
  const selectedDirections = sortedDirections.slice(0, 4);

  const taskTemplates = {
    health: [
      { text: 'Complete a 15-minute quick workout or brisk walk', xp: 25 },
      { text: 'Drink 2 liters of water throughout the day', xp: 20 },
      { text: 'Do 10 minutes of light stretching', xp: 15 },
    ],
    learning: [
      { text: 'Read 10 pages of a book or article', xp: 30 },
      { text: 'Watch an educational video on a new topic', xp: 25 },
      { text: 'Practice a skill for 20 minutes', xp: 35 },
    ],
    mindset: [
      { text: 'Do a 5-minute guided meditation', xp: 20 },
      { text: 'Write down 3 things you are grateful for', xp: 15 },
      { text: 'Take 5 deep breaths during a stress moment', xp: 10 },
    ],
    career: [
      { text: 'Review and update your top priority task list', xp: 25 },
      { text: 'Spend 30 minutes on focused deep work', xp: 40 },
      { text: 'Organize your workspace or digital files', xp: 20 },
    ],
    finance: [
      { text: 'Track today’s expenses and budget', xp: 20 },
      { text: 'Review financial goals for the month', xp: 25 },
      { text: 'Read 1 article on financial management', xp: 30 },
    ],
    social: [
      { text: 'Reach out to a friend or family member', xp: 25 },
      { text: 'Send a message of appreciation to someone', xp: 20 },
      { text: 'Schedule a catch-up call with a peer', xp: 30 },
    ],
    wellness: [
      { text: 'Get to bed 30 minutes earlier tonight', xp: 25 },
      { text: 'Take a screen break for 15 minutes', xp: 15 },
      { text: 'Prepare a healthy meal', xp: 30 },
    ],
    growth: [
      { text: 'Reflect on key learnings from this week', xp: 30 },
      { text: 'Try something new or outside your comfort zone', xp: 35 },
      { text: 'Set a micro-goal for tomorrow', xp: 20 },
    ],
  };

  const tasks = selectedDirections.map((dir, index) => {
    const list = taskTemplates[dir.id] || taskTemplates.growth;
    const template = list[Math.floor(Math.random() * list.length)];
    return {
      id: `task_${Date.now()}_${index}`,
      directionId: dir.id,
      directionName: dir.name,
      icon: dir.icon,
      title: template.text,
      xp: template.xp,
      completed: false,
      date: new Date().toISOString().split('T')[0],
    };
  });

  try {
    storage.set(STORAGE_KEYS.DAILY_TASKS, JSON.stringify(tasks));
    storage.set(STORAGE_KEYS.LAST_TASK_GEN_DATE, new Date().toISOString().split('T')[0]);
  } catch (e) {
    console.log('Error saving daily tasks:', e);
  }

  return tasks;
};

// Complete task -> update direction progress -> update goal progress
export const completeMandalaTask = (taskId) => {
  try {
    const rawTasks = storage.getString(STORAGE_KEYS.DAILY_TASKS);
    if (!rawTasks) return { success: false };

    let tasks = JSON.parse(rawTasks);
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return { success: false };

    tasks[taskIndex].completed = true;
    storage.set(STORAGE_KEYS.DAILY_TASKS, JSON.stringify(tasks));

    // Increase direction progress
    const directionId = tasks[taskIndex].directionId;
    const directions = getStoredDirections();
    const dirIndex = directions.findIndex((d) => d.id === directionId);

    if (dirIndex !== -1) {
      directions[dirIndex].progress = Math.min(100, directions[dirIndex].progress + 5);
      saveDirectionsToStore(directions);
    }

    return { success: true, updatedDirections: directions, updatedTasks: tasks };
  } catch (e) {
    console.log('Error completing mandala task:', e);
    return { success: false };
  }
};

// Calculate overall goal / mandala progress
export const calculateOverallProgress = (directions = getStoredDirections()) => {
  if (!directions || directions.length === 0) return 0;
  const total = directions.reduce((acc, curr) => acc + (curr.progress || 0), 0);
  return Math.round(total / directions.length);
};
