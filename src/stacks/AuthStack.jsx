import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from "../screens/auth/Login";
import Register from '../screens/auth/Register';
import ForgotPassword from '../screens/auth/ForgotPassword';
import Onboarding from '../screens/onboarding/Onboarding';
const Stack = createNativeStackNavigator()


const AuthStack=({initialRoute})=>{

    return(
        <Stack.Navigator screenOptions={{headerShown:false}} initialRouteName={initialRoute}>
            <Stack.Screen name='Onboarding' component={Onboarding}/>
            <Stack.Screen name="Login" component={Login}></Stack.Screen>
            <Stack.Screen name="Register" component={Register}></Stack.Screen>
            <Stack.Screen name="ForgotPassword" component={ForgotPassword}></Stack.Screen>
        </Stack.Navigator>
    )
}
export default AuthStack;