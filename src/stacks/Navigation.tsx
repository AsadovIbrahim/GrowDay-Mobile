import { NavigationContainer } from '@react-navigation/native';
import { useMMKVString,useMMKVBoolean } from 'react-native-mmkv';

import AuthStack from './AuthStack';
const Navigation=()=>{

    return(

        <NavigationContainer>
            <AuthStack></AuthStack>
        </NavigationContainer>
   )

}
export default Navigation;

