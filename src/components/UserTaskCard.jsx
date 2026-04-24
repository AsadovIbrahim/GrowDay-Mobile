import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faCheckCircle,
  faCircle,
  faTrash,
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
};

const UserTaskCard = ({ task, onComplete, onDelete }) => {
  const isCompleted = task.status === "Completed";
  const isOverdue = task.isOverdue;

  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Low;
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.Pending;

  const dueDateStr = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <View
      className="bg-white rounded-[20px] p-5 mb-4"
      style={{
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
        <TouchableOpacity
          onPress={() => !isCompleted && onComplete && onComplete(task.id)}
          className="flex-row items-start flex-1 mr-3"
          activeOpacity={isCompleted ? 1 : 0.7}
        >
          <FontAwesomeIcon
            icon={isCompleted ? faCheckCircle : faCircle}
            size={22}
            color={isCompleted ? "#22c55e" : "#d1d5db"}
            style={{ marginTop: 2 }}
          />
          <Text
            className="ml-3 text-[16px] font-redditsans-bold text-gray-900 flex-1 leading-6"
            style={{
              textDecorationLine: isCompleted ? "line-through" : "none",
              color: isCompleted ? "#9ca3af" : "#111827",
            }}
          >
            {task.title}
          </Text>
        </TouchableOpacity>

        {/* Delete */}
        {!isCompleted && onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(task.id)}
            className="w-8 h-8 items-center justify-center rounded-full bg-red-50"
          >
            <FontAwesomeIcon icon={faTrash} size={13} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Description */}
      {task.description ? (
        <Text className="text-[13px] font-redditsans-regular text-gray-500 mb-3 ml-9 leading-5">
          {task.description}
        </Text>
      ) : null}

      {/* Tags Row */}
      <View className="flex-row flex-wrap items-center gap-2 ml-9">
        {/* Priority badge */}
        <View
          className="flex-row items-center px-2.5 py-1 rounded-full"
          style={{ backgroundColor: priority.bg }}
        >
          <FontAwesomeIcon icon={faFlag} size={10} color={priority.color} />
          <Text
            className="ml-1 text-[11px] font-redditsans-bold"
            style={{ color: priority.color }}
          >
            {priority.label}
          </Text>
        </View>

        {/* Status badge */}
        <View
          className="flex-row items-center px-2.5 py-1 rounded-full"
          style={{ backgroundColor: status.bg }}
        >
          <Text
            className="text-[11px] font-redditsans-bold"
            style={{ color: status.color }}
          >
            {status.label}
          </Text>
        </View>

        {/* XP badge */}
        {task.xpReward > 0 && (
          <View className="flex-row items-center px-2.5 py-1 rounded-full bg-yellow-50">
            <FontAwesomeIcon icon={faStar} size={10} color="#f59e0b" />
            <Text className="ml-1 text-[11px] font-redditsans-bold text-yellow-600">
              +{task.xpReward} XP
            </Text>
          </View>
        )}

        {/* Due date */}
        {dueDateStr && (
          <View
            className="flex-row items-center px-2.5 py-1 rounded-full"
            style={{ backgroundColor: isOverdue ? "#fee2e2" : "#f3f4f6" }}
          >
            <FontAwesomeIcon
              icon={faClock}
              size={10}
              color={isOverdue ? "#ef4444" : "#6b7280"}
            />
            <Text
              className="ml-1 text-[11px] font-redditsans-bold"
              style={{ color: isOverdue ? "#ef4444" : "#6b7280" }}
            >
              {isOverdue ? "Overdue · " : ""}{dueDateStr}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default UserTaskCard;
