import { NavigationContainer } from '@react-navigation/native';
import { useMMKVString,useMMKVBoolean } from 'react-native-mmkv';
import TabStack from "./TabStack";
import AuthStack from './AuthStack';
const Navigation=()=>{
    const [accessToken,setAccessToken]=useMMKVString('accessToken');
    const [isOnBoardingShown]=useMMKVBoolean("isOnBoardingShown");
    return(
        <NavigationContainer>
            {accessToken ? (
                <TabStack />
            ) : (
                <AuthStack initialRoute={isOnBoardingShown ? "Login" : "Onboarding"} />
            )}
        </NavigationContainer>
   )

} 
export default Navigation;

