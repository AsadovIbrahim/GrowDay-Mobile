import { useContext } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { MenuContext } from '../../context/MenuContext';
import { useTheme } from '../../context/ThemeContext';

const HomeEmptyState = () => {
 
  const { setIsCreateModalOpen } = useContext(MenuContext);
  const { theme, isDark } = useTheme();
  const { colors } = theme;
 

  return (
    <>
      {/* ... previous code ... */}
      <View className="px-4 mb-4">
        <View style={{ backgroundColor: colors.cardSecondary }} className="rounded-2xl px-4 py-3 items-center justify-center">
          <Text style={{ color: colors.textSecondary }} className="font-redditsans-regular text-sm">
            Calendar will be active after you add habits
          </Text>
        </View>
      </View>

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
            <Text style={{ fontSize: 40 }}>🌱</Text>
          </View>

          <Text style={{ color: colors.text }} className="text-lg font-redditsans-bold mb-1 text-center">
            You haven't added any habits yet
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm font-redditsans-regular mb-5 text-center">
            Start small, stay consistent
          </Text>

          <TouchableOpacity 
            style={{ backgroundColor: colors.primary }}
            className="w-full rounded-full py-3 flex-row items-center justify-center mb-4"
            onPress={() => setIsCreateModalOpen(true)}
          >
            <FontAwesomeIcon icon={faPlus} color="#ffffff" size={18} />
            <Text className="ml-2 text-white text-base font-redditsans-medium">
              Add your first habit
            </Text>
          </TouchableOpacity>

          <Text style={{ color: colors.textSecondary }} className="text-xs font-redditsans-regular text-center">
            You can track habits daily{"\n"}and see your progress grow
          </Text>
        </View>
      </View>

      {/* Progress Today placeholder */}
      <View className="px-4 mb-20 ">
        <View 
          className="rounded-3xl px-4 py-4"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <Text style={{ color: colors.text }} className="text-base font-redditsans-bold mb-3">
            Progress Today
          </Text>
          <View style={{ backgroundColor: colors.cardSecondary }} className="rounded-2xl px-4 py-3 items-center justify-center">
            <Text style={{ color: colors.textSecondary }} className="text-sm font-redditsans-regular">
              Add habits to start tracking
            </Text>
          </View>
        </View>
      </View>
    </>
  );
};

export default HomeEmptyState;

