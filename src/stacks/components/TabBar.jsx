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
    const { isMenuOpen } = useContext(MenuContext);
    if (isMenuOpen) {
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
        let iconColor = '#9ca3af'; 
        let iconSize = 24;
        let containerStyle = {};

        switch (routeName) {
          case 'Home':
            icon = faHome;
            iconColor = isFocused ? '#8bc37a' : '#9ca3af';
            break;

          case 'Explore':
            icon = faCompass;
            iconColor = isFocused ? '#8bc37a' : '#9ca3af'; 
            containerStyle = {
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(156, 163, 175, 0.1)',
              alignItems: 'center', 
              justifyContent: 'center',
            };
            break;

          case 'Create':
            icon = faPlus;
            iconColor = '#ffffff';
            iconSize = 28;
            containerStyle = {
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#2f6f3f',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: -20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 8,
            };
            break;

          case 'Achievements':
            icon = faMedal;
            iconColor = isFocused ? '#8bc37a' : '#9ca3af'; 
            containerStyle = { position: 'relative' };
            break;

          case 'Profile':
            icon = faUser;
            iconColor = isFocused ? '#8bc37a' : '#9ca3af'; 
            break;

          default:
            break;
        }
        
        return(
            <TouchableOpacity 
              key={index} 
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
        )
    })}

        </View>
    )
}
export default TabBar;