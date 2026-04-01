import { NavigationContainer } from '@react-navigation/native';
import { useMMKVString, useMMKVBoolean } from 'react-native-mmkv';
import TabStack from "./TabStack";
import AuthStack from './AuthStack';
import UserPreferencesStack from './UserPreferencesStack';
import { MenuContext } from '../context/MenuContext';
import { useState } from 'react';
import CreateHabitBottomSheet from '../components/CreateHabitBottomSheet';


const Navigation = () => {
    const [accessToken] = useMMKVString('accessToken');
    const [isOnBoardingShown] = useMMKVBoolean("isOnBoardingShown");
    const [hasCompletedPreferences] = useMMKVBoolean("hasCompletedPreferences");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    return (
        <MenuContext.Provider value={{ 
            isMenuOpen, 
            setIsMenuOpen, 
            isCreateModalOpen, 
            setIsCreateModalOpen 
        }}>
            <NavigationContainer>
                {!accessToken ? (
                    <AuthStack initialRoute={isOnBoardingShown === true ? "Login" : "Onboarding"} />
                 ) : !hasCompletedPreferences ? (
                    <UserPreferencesStack />
                ) : (
                    <TabStack />
                )}
            </NavigationContainer>
            <CreateHabitBottomSheet />
        </MenuContext.Provider>
    );
};


export default Navigation;
