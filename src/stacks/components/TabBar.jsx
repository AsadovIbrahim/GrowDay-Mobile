import { View, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { MenuContext } from '../../context/MenuContext';
import { useContext } from 'react';
import { 
  faHome, 
  faCompass, 
  faPlus, 
  faMedal, 
  faUser 
} from '@fortawesome/free-solid-svg-icons';

const TabBar = ({state, navigation}) => {
    const { isMenuOpen, setIsCreateModalOpen } = useContext(MenuContext);
    if (isMenuOpen) {
        return null;
    }

    // Check if we're on Notification screen
    const homeRoute = state.routes.find(route => route.name === 'Home');
    const isNotificationScreen = homeRoute?.state?.routes?.[homeRoute.state.index]?.name === 'Notification';
    const isNotificationDetailScreen = homeRoute?.state?.routes?.[homeRoute.state.index]?.name === 'NotificationDetail';
    if (isNotificationDetailScreen) {
        return null;
    }
    if (isNotificationScreen) {
        return null;
    }

    return(
        <View className="flex-row justify-around items-center bg-white px-4 py-3 rounded-full mx-4 mb-4"


        style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
            elevation: 12,
          }}
          >
            {state.routes.map((route, index) => {
                const routeName = route.name;
                const isFocused = state.index === index;

                let icon = null;
                let iconColor = isFocused ? '#8bc37a' : '#9ca3af';
                let iconSize = 24;
                let containerStyle = {};

                switch (routeName) {
                    case 'Home': icon = faHome; break;
                    case 'Explore':
                        icon = faCompass;
                        containerStyle = {
                            width: 32, height: 32, borderRadius: 16,
                            backgroundColor: 'rgba(156, 163, 175, 0.1)',
                            alignItems: 'center', justifyContent: 'center',
                        };
                        break;
                    case 'Achievements':
                        icon = faMedal;
                        containerStyle = { position: 'relative' };
                        break;
                    case 'Profile': icon = faUser; break;
                }

                const renderPlusButton = () => (
                    <TouchableOpacity
                        key="plus-button"
                        onPress={() => setIsCreateModalOpen(true)}
                        className="items-center justify-center"
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            backgroundColor: '#2f6f3f',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: -32,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.35,
                            shadowRadius: 10,
                            elevation: 12,
                            borderWidth: 4,
                            borderColor: '#f9fafb'
                        }}
                    >
                        <FontAwesomeIcon icon={faPlus} color="#ffffff" size={28} />
                    </TouchableOpacity>
                );

                const component = (
                    <TouchableOpacity
                        key={route.key}
                        onPress={() => navigation.navigate(route.name)}
                        style={containerStyle}
                        className="items-center justify-center"
                    >
                        {routeName === 'Achievements' && (
                            <View
                                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10"
                                style={{ right: -2 }}
                            />
                        )}
                        <FontAwesomeIcon
                            icon={icon}
                            color={iconColor}
                            size={iconSize}
                        />
                    </TouchableOpacity>
                );

                if (index === 2) {
                    return [renderPlusButton(), component];
                }
                return component;
            })}

        </View>
    )
}
export default TabBar;