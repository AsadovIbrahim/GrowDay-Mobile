import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Onboarding from '../screens/onboarding/Onboarding';
const Stack = createNativeStackNavigator()


const AuthStack=()=>{

    return(
        <Stack.Navigator>
            <Stack.Screen options={{headerShown:false}} name='Onboarding' component={Onboarding}/>
        </Stack.Navigator>
    )
}
export default AuthStack;