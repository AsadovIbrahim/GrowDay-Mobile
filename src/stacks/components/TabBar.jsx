import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faHome, faUser } from '@fortawesome/free-solid-svg-icons';

const TabBar = ({state, navigation}) => {
    return(
        <View className="flex-row justify-between items-center bg-white h-16">
            {state.routes.map((route, index) => {
        const routeName = route.name;
        const isFocused = state.index === index;

        const iconColor = isFocused?'#000000':'#888589';
        

        let icon = null;
        let label = '';

        switch (routeName) {
          case 'Home':
            icon = <FontAwesomeIcon icon={faHome} color={iconColor} size={24} />;
            label = "Home";
            break;

          case 'Profile':
          icon = <FontAwesomeIcon icon={faUser} color={iconColor} size={24} />;
          label = "Profile";
          break;

          default:
            label = routeName;
        }
        
        return(
            
            <TouchableOpacity key={index} onPress={() => navigation.navigate(route.name)}>
               {icon}
                <Text>{label}</Text>
            </TouchableOpacity>
        )
    })}

        </View>
    )
}
export default TabBar;