import { View, Text } from "react-native";
import CalendarSelector from './CalendarSelector';

const HomeEmptyState = () => {
  return (
    <>
      {/* Calendar inactive info */}
      <View className="px-4 mb-4">
        <View className="bg-[#d9dfd3] rounded-2xl px-4 py-3 items-center justify-center">
          <Text className="text-gray-700 font-redditsans-regular text-sm">
            Calendar will be active after you add habits
          </Text>
        </View>
      </View>

      

      {/* Empty State Card */}
      <View className="px-4 mb-6">
        <View
          className="bg-white rounded-3xl px-6 py-8 items-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View className="w-24 h-24 rounded-full bg-green-50 items-center justify-center mb-4">
            <Text style={{ fontSize: 40 }}>🌱</Text>
          </View>

          <Text className="text-lg font-redditsans-bold text-black mb-1 text-center">
            You haven't added any habits yet
          </Text>
          <Text className="text-sm text-gray-500 font-redditsans-regular mb-5 text-center">
            Start small, stay consistent
          </Text>

          <TouchableOpacity className="w-full bg-green-500 rounded-full py-3 flex-row items-center justify-center mb-4">
            <FontAwesomeIcon icon={faPlus} color="#ffffff" size={18} />
            <Text className="ml-2 text-white text-base font-redditsans-medium">
              Add your first habit
            </Text>
          </TouchableOpacity>

          <Text className="text-xs text-gray-500 font-redditsans-regular text-center">
            You can track habits daily{"\n"}and see your progress grow
          </Text>
        </View>
      </View>

      {/* Progress Today placeholder */}
      <View className="px-4 mb-20 ">
        <View 
          className="bg-white/30 rounded-3xl px-4 py-4"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <Text className="text-base font-redditsans-bold text-black mb-3">
            Progress Today
          </Text>
          <View className="bg-[#d9dfd3] rounded-2xl px-4 py-3 items-center justify-center">
            <Text className="text-gray-600 text-sm font-redditsans-regular">
              Add habits to start tracking
            </Text>
          </View>
        </View>
      </View>
    </>
  );
};

export default HomeEmptyState;

