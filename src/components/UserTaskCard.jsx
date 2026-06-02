import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faCheckCircle,
  faCircle,
  faFlag,
  faClock,
  faStar,
} from "@fortawesome/free-solid-svg-icons";

const PRIORITY_CONFIG = {
  Low: { color: "#22c55e", bg: "#dcfce7", label: "Low" },
  Medium: { color: "#f59e0b", bg: "#fef3c7", label: "Medium" },
  High: { color: "#f97316", bg: "#ffedd5", label: "High" },
  Critical: { color: "#ef4444", bg: "#fee2e2", label: "Critical" },
};

const STATUS_CONFIG = {
  Pending: { color: "#6b7280", bg: "#f3f4f6", label: "Pending" },
  InProgress: { color: "#3b82f6", bg: "#dbeafe", label: "In Progress" },
  Completed: { color: "#22c55e", bg: "#dcfce7", label: "Completed" },
  Cancelled: { color: "#ef4444", bg: "#fee2e2", label: "Cancelled" },
  Expired: { color: "#94a3b8", bg: "#f1f5f9", label: "Expired" },
};

import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

import { getTranslatedTask } from "../utils/taskTranslations";

const UserTaskCard = ({ task, onComplete, onDelete }) => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const isCompleted = task.status === "Completed";
  const isExpired = task.status === "Expired";
  const isOverdue = task.isOverdue || isExpired;

  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Low;
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.Pending;

  const dueDateStr = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    : null;

  const { title: displayTitle, desc: displayDesc } = getTranslatedTask(task, t);

  return (
    <TouchableOpacity
      activeOpacity={isCompleted || isExpired || task.triggerType === 1 ? 1 : 0.8}
      onPress={() => {
        if (isCompleted || isExpired) return;
        if (task.triggerType === 1) return; // Automated tasks cannot be manually completed
        if (onComplete) onComplete(task.id);
      }}
      className="rounded-[20px] p-5 mb-4"
      style={{
        backgroundColor: colors.card,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        opacity: isCompleted ? 0.65 : 1,
        borderLeftWidth: 4,
        borderLeftColor: priority.color,
      }}
    >
      {/* Top Row */}
      <View className="flex-row items-start justify-between mb-3">
        {/* Complete button + title */}
        <View
          className="flex-row items-start flex-1 mr-3"
        >
          <FontAwesomeIcon
            icon={isCompleted ? faCheckCircle : faCircle}
            size={22}
            color={isCompleted ? "#22c55e" : "#d1d5db"}
            style={{ marginTop: 2 }}
          />
          <Text
            className="ml-3 text-[16px] font-redditsans-bold flex-1 leading-6"
            style={{
              textDecorationLine: isCompleted ? "line-through" : "none",
              color: isCompleted ? colors.textSecondary : colors.text,
            }}
          >
            {displayTitle}
          </Text>
        </View>

      </View>

      {/* Description */}
      {displayDesc ? (
        <Text className="text-[13px] font-redditsans-regular mb-3 ml-9 leading-5" style={{ color: colors.textSecondary }}>
          {displayDesc}
        </Text>
      ) : null}

      {/* Tags Row */}
      <View className="flex-row flex-wrap items-center gap-2 ml-9">
        {/* Priority badge */}
        <View
          className="flex-row items-center px-2.5 py-1 rounded-full"
          style={{ backgroundColor: isDark ? `${priority.color}20` : priority.bg }}
        >
          <FontAwesomeIcon icon={faFlag} size={10} color={priority.color} />
          <Text
            className="ml-1 text-[11px] font-redditsans-bold"
            style={{ color: priority.color }}
          >
            {t(`explore.priority.${task.priority.toLowerCase()}`)}
          </Text>
        </View>

        {/* Status badge */}
        <View
          className="flex-row items-center px-2.5 py-1 rounded-full"
          style={{ backgroundColor: isDark ? `${status.color}20` : status.bg }}
        >
          <Text
            className="text-[11px] font-redditsans-bold"
            style={{ color: status.color }}
          >
            {t(`explore.status.${task.status.toLowerCase()}`)}
          </Text>
        </View>

        {/* XP badge */}
        {task.xpReward > 0 && (
          <View className="flex-row items-center px-2.5 py-1 rounded-full" style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fefce8' }}>
            <FontAwesomeIcon icon={faStar} size={10} color="#f59e0b" />
            <Text className="ml-1 text-[11px] font-redditsans-bold text-yellow-600" style={{ color: isDark ? '#fbbf24' : '#d97706' }}>
              +{task.xpReward} XP
            </Text>
          </View>
        )}

        {/* Due date */}
        {dueDateStr && (
          <View
            className="flex-row items-center px-2.5 py-1 rounded-full"
            style={{ backgroundColor: isOverdue ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2') : (isDark ? 'rgba(107, 114, 128, 0.15)' : '#f3f4f6') }}
          >
            <FontAwesomeIcon
              icon={faClock}
              size={10}
              color={isOverdue ? "#ef4444" : colors.textSecondary}
            />
            <Text
              className="ml-1 text-[11px] font-redditsans-bold"
              style={{ color: isOverdue ? "#ef4444" : colors.textSecondary }}
            >
              {isOverdue ? `${t("common.missed")} · ` : ""}{dueDateStr}
            </Text>
          </View>
        )}
      </View>

      {/* Progress Bar for HabitCount tasks */}
      {task.triggerType === 1 && !isCompleted && task.triggerValue > 0 && (
        <View className="mt-4 ml-9">
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-[11px] font-redditsans-medium" style={{ color: colors.textSecondary }}>
              {t("common.progress", { defaultValue: "Progress" })}: {task.currentValue} / {task.triggerValue}
            </Text>
            <Text className="text-[11px] font-redditsans-bold" style={{ color: colors.primary }}>
              {Math.round((task.currentValue / task.triggerValue) * 100)}%
            </Text>
          </View>
          <View className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (task.currentValue / task.triggerValue) * 100)}%`,
                backgroundColor: (task.currentValue / task.triggerValue) >= 1 ? '#22c55e' : colors.primary
              }}
            />
          </View>

        </View>
      )}
    </TouchableOpacity>
  );
};

export default UserTaskCard;
