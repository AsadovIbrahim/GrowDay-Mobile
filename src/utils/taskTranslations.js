export const getTranslatedTask = (task, t) => {
  let title = task.title;
  let desc = task.description;

  if (!task.title) return { title, desc };

  if (task.title === "Early Bird") {
    title = t("user_tasks.early_bird_title", { defaultValue: title });
    desc = t("user_tasks.early_bird_desc", { defaultValue: desc });
  } else if (task.title === "Welcome to GrowDay!") {
    title = t("user_tasks.welcome_to_growday_title", { defaultValue: title });
    desc = t("user_tasks.welcome_to_growday_desc", { defaultValue: desc });
  } else if (task.title === "Habit Explorer") {
    title = t("user_tasks.habit_explorer_title", { defaultValue: title });
    desc = t("user_tasks.habit_explorer_desc", { defaultValue: desc });
  } else if (task.title === "Complete Your Profile") {
    title = t("user_tasks.complete_your_profile_title", { defaultValue: title });
    desc = t("user_tasks.complete_your_profile_desc", { defaultValue: desc });
  } else if (task.title.startsWith("Habit Warrior")) {
    const match = task.title.match(/Requirement: (\d+) Habits/);
    const count = match ? match[1] : "3";
    title = t("user_tasks.habit_warrior", { count, defaultValue: title });
    desc = t("user_tasks.habit_warrior_desc", { count, defaultValue: desc });
  } else if (task.title.startsWith("Consistency King")) {
    const match = task.title.match(/Requirement: (\d+) Habits/);
    const count = match ? match[1] : "5";
    title = t("user_tasks.consistency_king", { count, defaultValue: title });
    desc = t("user_tasks.consistency_king_desc", { count, defaultValue: desc });
  } else if (task.title.startsWith("Skill Sharpener")) {
    const match = task.title.match(/Requirement: (\d+) Habits/);
    const count = match ? match[1] : "5";
    title = t("user_tasks.skill_sharpener_title", { count, defaultValue: title });
    desc = t("user_tasks.skill_sharpener_desc", { count, defaultValue: desc });
  } else if (task.title === "Knowledge Seeker") {
    title = t("user_tasks.knowledge_seeker_title", { defaultValue: title });
    desc = t("user_tasks.knowledge_seeker_desc", { defaultValue: desc });
  } else if (task.title.startsWith("Weekend Warrior")) {
    const match = task.title.match(/Requirement: (\d+) Habits/);
    const count = match ? match[1] : "4";
    title = t("user_tasks.weekend_warrior_title", { count, defaultValue: title });
    desc = t("user_tasks.weekend_warrior_desc", { count, defaultValue: desc });
  } else if (task.title.startsWith("Water Master")) {
    const match = task.title.match(/Requirement: (\d+) Habits/);
    const count = match ? match[1] : "1";
    title = t("user_tasks.water_master_title", { count, defaultValue: title });
    desc = t("user_tasks.water_master_desc", { count, defaultValue: desc });
  }

  return { title, desc };
};
