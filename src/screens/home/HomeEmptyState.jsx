import { useContext } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlus, faCalendarCheck } from "@fortawesome/free-solid-svg-icons";
import { MenuContext } from "../../context/MenuContext";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import GettingStartedChecklist from "./components/GettingStartedChecklist";
import AIMentorCard from "../../components/AIMentorCard";

const HomeEmptyState = ({ accountData, onLogMoodPress, onAwardBonusXP }) => {
  const { setIsCreateModalOpen } = useContext(MenuContext);
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();

  return (
    <>
      {/* Getting Started Checklist Section */}
      <GettingStartedChecklist
        accountData={accountData}
        onLogMoodPress={onLogMoodPress}
        userHabitCount={0}
        onAwardBonusXP={onAwardBonusXP}
      />

      {/* Empty State Card */}
      <View className="px-4 mb-6">
        <View
          className="rounded-3xl px-6 py-8 items-center"
          style={{
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View style={{ backgroundColor: colors.primarySurface }} className="w-24 h-24 rounded-full items-center justify-center mb-4">
            <FontAwesomeIcon icon={faCalendarCheck} size={42} color={colors.primary} />
          </View>

          <Text style={{ color: colors.text }} className="text-lg font-redditsans-bold mb-1 text-center">
            {t("home.empty_title")}
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm font-redditsans-regular mb-5 text-center">
            {t("home.empty_subtitle")}
          </Text>

          <TouchableOpacity
            style={{ backgroundColor: colors.primary }}
            className="w-full rounded-full py-3 flex-row items-center justify-center mb-4"
            onPress={() => setIsCreateModalOpen(true)}
          >
            <FontAwesomeIcon icon={faPlus} color="#ffffff" size={18} />
            <Text className="ml-2 text-white text-base font-redditsans-medium">
              {t("home.add_first_habit")}
            </Text>
          </TouchableOpacity>

          <Text style={{ color: colors.textSecondary }} className="text-xs font-redditsans-regular text-center">
            {t("home.empty_hint")}
          </Text>
        </View>
      </View>

      {/* AI Mentor Section */}
      <View className="px-4 mb-20">
        <AIMentorCard totalExperiencePoints={accountData?.totalExperiencePoints || 0} />
      </View>
    </>
  );
};

export default HomeEmptyState;
