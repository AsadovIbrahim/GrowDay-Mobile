import { View, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { MenuContext } from '../../context/MenuContext';
import { useContext } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  faHome,
  faCompass,
  faPlus,
  faMedal,
  faUser
} from '@fortawesome/free-solid-svg-icons';

const TabBar = ({ state, navigation }) => {
    const { isMenuOpen, setIsCreateModalOpen } = useContext(MenuContext);
    const { theme } = useTheme();
    const { colors } = theme;

    if (isMenuOpen) return null;

    // Hide on notification screens
    const homeRoute = state.routes.find(route => route.name === 'Home');
    const activeHomeName = homeRoute?.state?.routes?.[homeRoute.state.index]?.name;
    if (activeHomeName === 'Notification' || activeHomeName === 'NotificationDetail') {
        return null;
    }

    // Hide on profile sub-screens
    const profileRoute = state.routes.find(route => route.name === 'Profile');
    const activeProfileName = profileRoute?.state?.routes?.[profileRoute.state.index]?.name;
    const profileSubScreens = ['NotificationsSettings', 'LanguageSettings', 'ChangePassword', 'ContactSupport'];
    if (profileSubScreens.includes(activeProfileName)) {
        return null;
    }

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.card,
                    shadowColor: theme.isDark ? '#000' : '#000',
                    shadowOpacity: theme.isDark ? 0.4 : 0.12,
                    borderWidth: theme.isDark ? 1 : 0,
                    borderColor: theme.isDark ? colors.border : 'transparent',
                }
            ]}
        >
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const activeColor = colors.primary;
                const inactiveColor = colors.iconMuted;
                let icon = null;

                switch (route.name) {
                    case 'Home': icon = faHome; break;
                    case 'Explore': icon = faCompass; break;
                    case 'Achievements': icon = faMedal; break;
                    case 'Profile': icon = faUser; break;
                }

                const plusButton = (
                    <TouchableOpacity
                        key="plus-button"
                        onPress={() => setIsCreateModalOpen(true)}
                        style={[
                            styles.plusBtn,
                            {
                                backgroundColor: colors.primary,
                                borderColor: colors.card,
                            }
                        ]}
                        activeOpacity={0.85}
                    >
                        <FontAwesomeIcon icon={faPlus} color="#ffffff" size={26} />
                    </TouchableOpacity>
                );

                const tabBtn = (
                    <TouchableOpacity
                        key={route.key}
                        onPress={() => navigation.navigate(route.name)}
                        style={styles.tabBtn}
                        activeOpacity={0.7}
                    >
                        {route.name === 'Achievements' && (
                            <View style={styles.badge} />
                        )}
                        <FontAwesomeIcon
                            icon={icon}
                            color={isFocused ? activeColor : inactiveColor}
                            size={23}
                        />
                    </TouchableOpacity>
                );

                // Insert plus button before index 2 (between Explore and Achievements)
                if (index === 2) {
                    return [plusButton, tabBtn];
                }
                return tabBtn;
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 999,
        marginHorizontal: 16,
        marginBottom: 16,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 20,
        elevation: 12,
    },
    tabBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
    },
    plusBtn: {
        width: 62,
        height: 62,
        borderRadius: 31,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -30,
        borderWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 12,
    },
    badge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        zIndex: 10,
    },
});

export default TabBar;