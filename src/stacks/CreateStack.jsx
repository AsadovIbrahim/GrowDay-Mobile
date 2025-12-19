import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Create from "../screens/create/Create";

const Stack = createNativeStackNavigator();

const CreateStack = () => {
    return(
        <Stack.Navigator screenOptions={{headerShown:false}}>
            <Stack.Screen name="Create" component={Create} />
        </Stack.Navigator>
    )
}
export default CreateStack;

